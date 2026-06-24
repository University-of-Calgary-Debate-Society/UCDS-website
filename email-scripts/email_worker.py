import os
import sys
import time
import smtplib
import json
import argparse
import urllib.request
import urllib.parse
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def load_env():
    """
    Zero-dependency local .env loader.
    """
    env = {}
    script_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(script_dir, ".env")
    if os.path.exists(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        env[k.strip()] = v.strip()
        except Exception as e:
            print(f"Warning: Could not read .env file: {e}")
    return env

def make_api_request(url, data):
    """
    Make a POST request to the Google Apps Script Web App using zero-dependency urllib.
    Handles redirects (which Google Apps Script relies heavily on).
    """
    json_data = json.dumps(data).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=json_data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_content = response.read().decode("utf-8")
            return json.loads(res_content)
    except urllib.error.HTTPError as e:
        print(f"HTTP Error: {e.code} - {e.reason}")
        try:
            print(e.read().decode("utf-8"))
        except:
            pass
        return {"result": "error", "error": f"HTTP Error: {e.code}"}
    except Exception as e:
        return {"result": "error", "error": str(e)}

def process_pending_schedules(api_url, admin_password, sender_email, app_password):
    """
    Poll the web app, fetch pending email schedules, and dispatch them via Gmail SMTP.
    """
    print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] Polling for pending email campaigns...")
    
    payload = {
        "action": "getPendingSends",
        "password": admin_password
    }
    
    response = make_api_request(api_url, payload)
    
    if response.get("result") != "success":
        print(f"Error checking pending sends: {response.get('error')}")
        return
        
    pending_list = response.get("pending", [])
    if not pending_list:
        print("No pending scheduled emails found.")
        return
        
    print(f"Found {len(pending_list)} pending campaign(s) to process.")
    
    for campaign in pending_list:
        schedule_id = campaign.get("scheduleId")
        subject = campaign.get("subject")
        template_html = campaign.get("templateHtml")
        plain_text_template = campaign.get("plainText")
        base_unsub_link = campaign.get("baseUnsubscribeLink")
        recipients = campaign.get("recipients", [])
        
        print("\n" + "="*70)
        print(f"Processing Campaign ID: {schedule_id}")
        print(f"Subject: {subject}")
        print(f"Recipients Count: {len(recipients)}")
        print("="*70)
        
        if not recipients:
            print("No active recipients. Marking campaign as sent.")
            mark_campaign_sent(api_url, admin_password, schedule_id, "Sent", "No active subscribers found in target mailing list.")
            continue
            
        try:
            print("Connecting to Gmail SMTP server (smtp.gmail.com:587)...")
            smtp_server = smtplib.SMTP("smtp.gmail.com", 587)
            smtp_server.ehlo()
            smtp_server.starttls()
            smtp_server.ehlo()
            print("Logging in to Gmail SMTP...")
            smtp_server.login(sender_email, app_password)
        except Exception as e:
            print(f"CRITICAL SMTP CONNECTION ERROR: {e}")
            mark_campaign_sent(api_url, admin_password, schedule_id, "Failed", f"SMTP Login Failed: {str(e)}")
            continue
            
        success_count = 0
        fail_count = 0
        errors = []
        
        # Deduplicate recipients' email addresses case-insensitively
        seen_emails = set()
        unique_recipients = []
        for r in recipients:
            email = (r.get("email") or "").strip().lower()
            if email and email not in seen_emails:
                seen_emails.add(email)
                unique_recipients.append(r)
        
        if not unique_recipients:
            print("No active recipients. Marking campaign as sent.")
            mark_campaign_sent(api_url, admin_password, schedule_id, "Sent", "No active subscribers found in target mailing list.")
            try:
                smtp_server.quit()
            except:
                pass
            continue
            
        print(f"Sending individually to {len(unique_recipients)} unique recipient(s)...")
        
        # Clean base unsubscribe link by stripping any existing query parameters
        base_unsub = base_unsub_link.split("?")[0] if "?" in base_unsub_link else base_unsub_link
        
        for r in unique_recipients:
            recipient_email = r.get("email", "").strip()
            recipient_name  = r.get("name") or "there"
            unsub_link = base_unsub + "?email=" + urllib.parse.quote(recipient_email, safe="")
            
            html_content  = template_html.replace("{{name}}", recipient_name).replace("{{unsubscribe_link}}", unsub_link)
            plain_content = plain_text_template.replace("{{name}}", recipient_name).replace("{{unsubscribe_link}}", unsub_link)
            
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"]    = sender_email
            msg["To"]      = recipient_email
            
            msg.attach(MIMEText(plain_content, "plain"))
            msg.attach(MIMEText(html_content, "html"))
            
            try:
                smtp_server.sendmail(sender_email, [recipient_email], msg.as_string())
                success_count += 1
                print(f"  Sent to {recipient_email}")
            except Exception as e:
                fail_count += 1
                errors.append(f"{recipient_email}: {str(e)}")
                print(f"  FAILED to send to {recipient_email}: {e}")
            
        try:
            smtp_server.quit()
        except:
            pass
            
        print("-"*70)
        print(f"Campaign Complete. Success: {success_count}, Failed: {fail_count}")
        
        if success_count == 0 and fail_count > 0:
            status = "Failed"
            summary_err = f"All sends failed. First error: {errors[0]}" if errors else "Unknown dispatch error."
        else:
            status = "Sent"
            summary_err = f"Sent to {success_count} recipient(s)." + (f" Failures: {fail_count}" if fail_count > 0 else "")
            
        mark_campaign_sent(api_url, admin_password, schedule_id, status, summary_err)

def mark_campaign_sent(api_url, admin_password, schedule_id, status, error_message):
    payload = {
        "action": "markSent",
        "password": admin_password,
        "id": schedule_id,
        "status": status,
        "error": error_message
    }
    
    response = make_api_request(api_url, payload)
    if response.get("result") == "success":
        print(f"Successfully marked schedule {schedule_id} as status '{status}' in database.")
    else:
        print(f"WARNING: Failed to update status for schedule {schedule_id} in database. Error: {response.get('error')}")

def main():
    env = load_env()
    
    default_api_url = env.get("UCDS_API_URL") or os.environ.get("UCDS_API_URL")
    default_admin_password = env.get("UCDS_ADMIN_PASSWORD") or os.environ.get("UCDS_ADMIN_PASSWORD")
    default_sender_email = env.get("UCDS_SENDER_EMAIL") or os.environ.get("UCDS_SENDER_EMAIL")
    default_app_password = env.get("UCDS_SMTP_PASSWORD") or os.environ.get("UCDS_SMTP_PASSWORD")

    parser = argparse.ArgumentParser(description="UCDS Campaign Email Dispatch Worker daemon.")
    parser.add_argument("--loop", action="store_true", help="Run the worker in a continuous polling loop.")
    parser.add_argument("--interval", type=int, default=60, help="Interval in seconds between polls when running in loop mode.")
    parser.add_argument("--email", default=default_sender_email, help="Gmail address to send emails from.")
    parser.add_argument("--password", default=default_app_password, help="Gmail 16-character App Password.")
    parser.add_argument("--api-key", default=default_admin_password, help="UCDS Executive API administration password.")
    parser.add_argument("--api-url", default=default_api_url, help="UCDS Google Apps Script Web App Deployment URL.")
    
    args = parser.parse_args()
    
    if not args.api_url or not args.api_key or not args.email or not args.password:
        print("CRITICAL CONFIGURATION ERROR: Missing required parameters.")
        print("Provide them via command-line arguments or define them in local 'email-scripts/.env' file.")
        print("Review '.env.template' for configuration details.")
        sys.exit(1)

    print("=========================================================")
    print("          UCDS Campaign Email Polling Worker             ")
    print("=========================================================")
    print(f"Sender Email: {args.email}")
    print(f"Apps Script API URL: {args.api_url}")
    print(f"Loop Mode: {args.loop} (Interval: {args.interval}s)" if args.loop else "Mode: Run-once check")
    print("=========================================================\n")
    
    if args.loop:
        try:
            while True:
                try:
                    process_pending_schedules(args.api_url, args.api_key, args.email, args.password)
                except Exception as e:
                    print(f"Unexpected error in worker execution loop: {e}")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nWorker daemon terminated by user. Exiting.")
    else:
        process_pending_schedules(args.api_url, args.api_key, args.email, args.password)

if __name__ == "__main__":
    main()
