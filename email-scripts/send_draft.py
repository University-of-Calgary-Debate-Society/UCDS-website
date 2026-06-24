import os
import smtplib
import getpass
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

def main():
    print("====================================================================")
    print("             UCDS Calgary Summer Cup Email Dispatcher               ")
    print("====================================================================")
    print()

    env = load_env()

    # Recipient
    to_email = input("Recipient Email [default: business.michaelwang@gmail.com]: ").strip()
    if not to_email:
        to_email = "business.michaelwang@gmail.com"

    # Sender Info
    default_sender = env.get("UCDS_SENDER_EMAIL") or os.environ.get("UCDS_SENDER_EMAIL") or "ucds.debate@gmail.com"
    from_email = input(f"Your Gmail address [default: {default_sender}]: ").strip()
    if not from_email:
        from_email = default_sender

    # App Password Configuration
    default_pass = env.get("UCDS_SMTP_PASSWORD") or os.environ.get("UCDS_SMTP_PASSWORD")
    if default_pass:
        print("Using SMTP credentials from environment config.")
        password = default_pass
    else:
        print("Please enter your Gmail App Password.")
        print("Note: If you use 2-Factor Authentication, you must generate a 16-character")
        print("App Password in your Google Account settings (Security > App Passwords).")
        password = getpass.getpass("App Password: ").strip()
        if not password:
            print("Error: App password is required.")
            return

    # File paths
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    template_path = os.path.join(project_root, "executive", "draft-emails", "email_template.html")

    if not os.path.exists(template_path):
        print(f"Error: Template file not found at {template_path}")
        return

    print(f"\nReading email template from {template_path}...")
    with open(template_path, "r", encoding="utf-8") as f:
        html_content = f.read()

    # Build Plain text fallback
    plain_text = (
        "🏆 Calgary Summer Cup 2026 - Register Now! (July 25-26, Online)\n\n"
        "The University of Calgary Debate Society is excited to invite you to the Calgary Summer Cup 2026! "
        "This tournament will be held online over Discord from Saturday, July 25th to Sunday, July 26th.\n\n"
        "Coaches, we would highly appreciate it if you could send this out to your debaters! The sign up form "
        "is also publicly accessible on our website ucds.ca.\n\n"
        "Go to UCDS Website: https://ucds.ca\n\n"
        "Register on Website: https://ucds.ca/events/calgary-summer-cup/registration/\n\n"
        "Tournament Invitation Package (Google Doc): https://docs.google.com/document/d/1Uz3oNbh6bMwVYUp7WFC6ptl_GYqH5kcPdL3056CA2iM/edit?usp=sharing\n\n"
        "If you have any questions or concerns, please contact us at ucds.debate@gmail.com."
    )

    # Set up email headers
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "🏆 Calgary Summer Cup 2026 - Register Now! (July 25-26, Online)"
    msg['From'] = from_email
    msg['To'] = to_email

    # Attach parts
    part1 = MIMEText(plain_text, 'plain')
    part2 = MIMEText(html_content, 'html')
    msg.attach(part1)
    msg.attach(part2)

    try:
        print("\nConnecting to Gmail SMTP server (smtp.gmail.com:587)...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.set_debuglevel(1)
        server.ehlo()
        server.starttls()
        server.ehlo()
        
        print("\nLogging in...")
        server.login(from_email, password)
        
        print(f"\nSending email to {to_email}...")
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        
        print("\nSUCCESS: Email dispatched successfully!")
    except smtplib.SMTPAuthenticationError as e:
        print(f"\nAUTHENTICATION ERROR: Failed to log in. Details: {e}")
        print("\nCommon troubleshooting steps:")
        print(f"1. Make sure you are using the exact Gmail address ('{from_email}') that generated the App Password.")
        print("2. Make sure 2-Factor Authentication is enabled on that account.")
        print("3. Ensure the App Password is copy-pasted correctly (it is a 16-character code, e.g. gywfcwrxomolcpws).")
    except Exception as e:
        print(f"\nERROR: Failed to send email. Details: {e}")
    finally:
        input("\nPress Enter to exit...")

if __name__ == "__main__":
    main()
