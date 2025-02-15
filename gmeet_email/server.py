import smtplib
import ssl

from flask import Flask, request, jsonify

app = Flask(__name__)

# SMTP Server Credentials (replace with your own secure method of storing credentials)
SMTP_HOST = "smtp.cloudmta.net"
SMTP_PORT = 2525
SMTP_USERNAME = "f2f731b2f948c506"
SMTP_PASSWORD = "1FLqHDpjk7PtvjbDqLAzP2Lj"

@app.route('/incoming_mails', methods=['POST'])
def cloudmailin_webhook():
    """
    This endpoint receives incoming emails from CloudMailin (or similar services)
    as a POST request containing JSON data.
    """
    data = request.get_json()
    print("data: ", data)
    print("-" * 50)

    full_plain_text = data.get("plain", "").strip()
    new_message = full_plain_text.split("\r\nOn ")[0]
    print("plain_text: ", new_message)

    message_id = data.get("headers", {}).get("message_id", "N/A")
    in_reply_to = data.get("headers", {}).get("in_reply_to", "N/A")
    references = data.get("headers", {}).get("references", "N/A")
    subject = data.get('headers', {}).get('subject', 'No Subject')
    from_email = data.get('envelope', {}).get('from', 'No Sender')

    print("New Message:\n", new_message)
    print("\nMessage IDs:")
    print("Message-ID:", message_id)
    print("In-Reply-To:", in_reply_to)
    print("References:", references)

    # Print the extracted fields to the console
    print(f"Subject: {subject}")
    print(f"From: {from_email}")

    return jsonify(status='ok')


@app.route('/send_email', methods=['POST'])
def send_email():
    """ Sends an email using SMTP with proper envelope sender formatting """

    data = request.get_json()
    to_email = data.get("to")
    email_body = data.get("message")
    subject = data.get("subject", "Test Email")
    from_email = data.get("from_email", "customer@reflectai.dev")

    if not to_email or not email_body:
        return jsonify({"status": "fail", "error": "Missing required fields (to and message)."}), 400

    # Ensure From header is included correctly in message body
    message = f"""\
From: {from_email}
To: {to_email}
Subject: {subject}

{email_body}
"""

    try:
        context = ssl.create_default_context()
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.ehlo()
            server.starttls(context=context)
            server.login(SMTP_USERNAME, SMTP_PASSWORD)

            # Use the actual "from_email" in the envelope sender argument
            server.sendmail(from_email, to_email, message)

    except Exception as e:
        return jsonify({"status": "fail", "error": str(e)}), 500

    return jsonify({"status": "success", "to": to_email, "subject": subject})


if __name__ == "__main__":
    # Run the Flask app
    app.run(host='0.0.0.0', port=5001, debug=True)
