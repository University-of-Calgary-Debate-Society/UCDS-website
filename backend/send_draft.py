import os
import sys
import smtplib
import getpass
import argparse
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
        cred = credentials.Certificate(key_path)
        firebase_admin.initialize_app(cred)
    else:
        try:
            firebase_admin.initialize_app()
        except Exception as e:
            print("CRITICAL ERROR: Failed to initialize Firebase Admin SDK.")
            print(f"Make sure {key_path} exists or GOOGLE_APPLICATION_CREDENTIALS is set.")
            print(f"Details: {e}")
            sys.exit(1)
            
    return firestore.client()

def main():
    print("====================================================================")
    print("             UCDS Modernized Email Draft Tester                     ")
    print("====================================================================")
    print()

    # Load environment variables
    script_dir = os.path.dirname(os.path.abspath(__file__))
    load_dotenv(os.path.join(script_dir, ".env"))

    # Initialize Firebase
    db = init_firebase()

    # Fetch Saved Drafts from Firestore
    try:
        drafts_ref = db.collection('drafts')
        draft_docs = list(drafts_ref.get())
    except Exception as e:
        print(f"Error fetching drafts from Firestore: {e}")
        print("Please verify database setup and credentials.")
        return

    if not draft_docs:
        print("No saved drafts found in the 'drafts' Firestore collection.")
        print("Please create and save a draft using the Executive Portal first.")
        return

    print("Available Email Drafts:")
    for idx, doc_snap in enumerate(draft_docs, 1):
        draft_data = doc_snap.to_dict()
        subject = draft_data.get('subject', 'No Subject')
        updated = draft_data.get('updatedAt', 'N/A')
        print(f" [{idx}] {subject} (Updated: {updated})")
    print()

    # Choose draft
    try:
        choice = int(input(f"Select draft number (1-{len(draft_docs)}): ").strip())
        if choice < 1 or choice > len(draft_docs):
            raise ValueError()
    except (ValueError, KeyboardInterrupt):
        print("Invalid selection or canceled.")
        return

    selected_doc = draft_docs[choice - 1]
    draft_data = selected_doc.to_dict()
    
    subject = draft_data.get('subject', 'No Subject')
    html_content = draft_data.get('templateHtml', '')
    plain_content = draft_data.get('plainText', '')

    print(f"\nSelected: '{subject}'")

    # Recipient
    to_email = input("Recipient Email [default: business.michaelwang@gmail.com]: ").strip()
    if not to_email:
        to_email = "business.michaelwang@gmail.com"

    # Sender Info
    default_sender = os.getenv("UCDS_SENDER_EMAIL") or "ucds.debate@gmail.com"
    from_email = input(f"Your Gmail address [default: {default_sender}]: ").strip()
    if not from_email:
        from_email = default_sender

    # App Password Configuration
    default_pass = os.getenv("UCDS_SMTP_PASSWORD")
    if default_pass:
        print("Using SMTP credentials from environment config.")
        password = default_pass
    else:
        print("Please enter your Gmail App Password.")
        password = getpass.getpass("App Password: ").strip()
        if not password:
            print("Error: App password is required.")
            return

    # Substitute Test Merge Tags
    test_name = "Test Recipient"
    test_unsub = "https://ucds.ca/#/connect/unsubscribe?email=" + to_email
    
    html_body = html_content.replace("{{name}}", test_name).replace("{{unsubscribe_link}}", test_unsub)
    plain_body = plain_content.replace("{{name}}", test_name).replace("{{unsubscribe_link}}", test_unsub)

    # Set up email headers
    msg = MIMEMultipart('alternative')
    msg['Subject'] = f"[TEST DRAFT] {subject}"
    msg['From'] = from_email
    msg['To'] = to_email

    # Attach parts
    msg.attach(MIMEText(plain_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))

    try:
        print("\nConnecting to Gmail SMTP server (smtp.gmail.com:587)...")
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.ehlo()
        server.starttls()
        server.ehlo()
        
        print("Logging in...")
        server.login(from_email, password)
        
        print(f"Sending test email to {to_email}...")
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        
        print("\nSUCCESS: Test draft dispatched successfully!")
    except Exception as e:
        print(f"\nERROR: Failed to send test email. Details: {e}")

if __name__ == "__main__":
    main()
