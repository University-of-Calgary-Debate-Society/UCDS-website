import os
import sys
import time
import smtplib
import argparse
import urllib.parse
from datetime import datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

def init_firebase():
    """
    Initialize Firebase Admin SDK using key file specified in .env,
    or falls back to default environment paths.
    """
    key_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY") or "firebase-service-account.json"
    
    # Try using the key file path
    if os.path.exists(key_path):
        print(f"Initializing Firebase with service account key: {key_path}")
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    else:
        # Fallback to default credential discovery (e.g. standard environment variables)
        try:
            print("No service account key file found. Attempting Application Default Credentials...")
            firebase_admin.initialize_app()
        except Exception as e:
            print("CRITICAL ERROR: Failed to initialize Firebase Admin SDK.")
            print(f"Make sure {key_path} exists or GOOGLE_APPLICATION_CREDENTIALS is set.")
            print(f"Details: {e}")
            sys.exit(1)
            
    return firestore.client()

def check_subscriber_active(db, email):
    """
    Check if a subscriber is still active in the database.
    This serves as a safeguard in case they unsubscribed between scheduling and sending.
    """
    try:
        subscribers_ref = db.collection('subscribers')
        query = subscribers_ref.where('email', '==', email.strip().lower()).limit(1)
        docs = query.get()
        
        for doc in docs:
            data = doc.to_dict()
            # If active is explicitly false, they are unsubscribed
            if data.get('active') is False:
                return False
        return True # Default to True if not found or explicitly active
    except Exception as e:
        print(f"  Warning: Error checking subscriber active status for {email}: {e}")
        return True

def process_pending_schedules(db, sender_email, app_password):
    """
    Fetch pending schedules from Firestore and send emails via SMTP.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Polling schedules (now: {now_iso})...")
    
    try:
        # Get pending campaigns that are scheduled for now or in the past
        schedules_ref = db.collection('schedules')
        query = (
            schedules_ref
            .where('status', '==', 'pending')
            .where('scheduledAt', '<=', now_iso)
            .order_by('scheduledAt')
        )
        docs = list(query.get())
    except Exception as e:
        print(f"Error querying pending schedules from Firestore: {e}")
        print("Verify your indexes, database credentials, or internet connection.")
        return

    if not docs:
        print("No pending scheduled emails found.")
        return
        
    print(f"Found {len(docs)} pending campaign(s) to process.")
    
    for doc_snap in docs:
        campaign_ref = doc_snap.reference
        campaign = doc_snap.to_dict()
        schedule_id = doc_snap.id
        
        subject = campaign.get("subject", "No Subject")
        template_html = campaign.get("templateHtml", "")
        plain_text_template = campaign.get("plainText", "")
        base_unsub_link = campaign.get("baseUnsubscribeLink", "https://ucds.ca/#/connect/unsubscribe")
        recipients = campaign.get("recipients", [])
        
        print("\n" + "="*70)
        print(f"Processing Campaign ID: {schedule_id}")
        print(f"Subject: {subject}")
        print(f"Initial Recipients Count: {len(recipients)}")
        print("="*70)
        
        # Mark campaign status as 'sending' to lock it
        try:
            campaign_ref.update({"status": "sending"})
        except Exception as e:
            print(f"Failed to lock campaign {schedule_id} status: {e}. Skipping.")
            continue

        if not recipients:
            print("No recipients. Marking campaign as sent.")
            campaign_ref.update({
                "status": "sent",
                "sentSummary": "No recipients found in campaign schedule.",
                "dispatchedAt": datetime.now(timezone.utc).isoformat()
            })
            continue

        # Establish SMTP connection
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
            campaign_ref.update({
                "status": "failed",
                "sentSummary": f"SMTP Connection/Login Failed: {str(e)}",
                "dispatchedAt": datetime.now(timezone.utc).isoformat()
            })
            continue

        success_count = 0
        fail_count = 0
        skipped_count = 0
        errors = []
        
        # Keep track of already processed email addresses in this campaign run to prevent duplicates
        processed_emails = set()
        
        # Clean base unsubscribe link by stripping query parameters
        base_unsub = base_unsub_link.split("?")[0] if "?" in base_unsub_link else base_unsub_link
        
        for r in recipients:
            recipient_email = r.get("email", "").strip()
            recipient_name  = r.get("name") or "there"
            
            if not recipient_email:
                continue
                
            email_lower = recipient_email.lower()
            
            # De-duplication Check
            if email_lower in processed_emails:
                print(f"  Skipped (Duplicate): {recipient_email}")
                skipped_count += 1
                continue
            processed_emails.add(email_lower)

            # Real-time Unsubscribe Check
            if not check_subscriber_active(db, recipient_email):
                print(f"  Skipped (Unsubscribed): {recipient_email}")
                skipped_count += 1
                continue

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
        summary = f"Dispatched. Success: {success_count}, Failed: {fail_count}, Skipped (Unsubscribed): {skipped_count}."
        print(summary)
        
        if success_count == 0 and fail_count > 0:
            status = "failed"
            summary_err = f"All dispatches failed. First error: {errors[0]}" if errors else "Unknown dispatch error."
        else:
            status = "sent"
            summary_err = summary + (f" First error: {errors[0]}" if errors else "")
            
        try:
            campaign_ref.update({
                "status": status,
                "sentSummary": summary_err,
                "dispatchedAt": datetime.now(timezone.utc).isoformat()
            })
            print(f"Successfully updated campaign status to '{status}' in Firestore.")
        except Exception as e:
            print(f"WARNING: Failed to update campaign status in Firestore: {e}")

def main():
    # Load .env file
    script_dir = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(script_dir, ".env"))
    
    default_sender_email = os.getenv("UCDS_SENDER_EMAIL")
    default_app_password = os.getenv("UCDS_SMTP_PASSWORD")

    parser = argparse.ArgumentParser(description="UCDS Firebase Campaign Email Worker.")
    parser.add_argument("--loop", action="store_true", help="Run the worker in a continuous polling loop.")
    parser.add_argument("--interval", type=int, default=60, help="Interval in seconds between polls when running in loop mode.")
    parser.add_argument("--email", default=default_sender_email, help="Gmail address to send emails from.")
    parser.add_argument("--password", default=default_app_password, help="Gmail 16-character App Password.")
    
    args = parser.parse_args()
    
    if not args.email or not args.password:
        print("CRITICAL CONFIGURATION ERROR: Missing required Gmail credentials.")
        print("Provide them via command-line arguments (--email, --password) or define them in '.env'.")
        sys.exit(1)

    print("=========================================================")
    print("      UCDS Firebase Campaign Email Polling Worker        ")
    print("=========================================================")
    print(f"Sender Email: {args.email}")
    print(f"Loop Mode: {args.loop} (Interval: {args.interval}s)" if args.loop else "Mode: Run-once check")
    print("=========================================================\n")
    
    # Initialize Firebase
    db = init_firebase()
    
    if args.loop:
        try:
            while True:
                try:
                    process_pending_schedules(db, args.email, args.password)
                except Exception as e:
                    print(f"Unexpected error in worker loop execution: {e}")
                time.sleep(args.interval)
        except KeyboardInterrupt:
            print("\nWorker daemon terminated by user. Exiting.")
    else:
        process_pending_schedules(db, args.email, args.password)

if __name__ == "__main__":
    main()
