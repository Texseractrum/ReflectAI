from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/incoming_mails', methods=['POST'])
def cloudmailin_webhook():
    # Get the JSON data from the POST request
    data = request.get_json()
    print("data: ", data)
    print("-" * 50)
    full_plain_text = data.get("plain", "").strip()
    new_message = full_plain_text.split("\r\nOn ")[0]
    print("plain_text: ", new_message)


    message_id = data["headers"].get("message_id", "N/A")
    in_reply_to = data["headers"].get("in_reply_to", "N/A")
    references = data["headers"].get("references", "N/A")
    # Access specific fields from the JSON data
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

if __name__ == "__main__":
    app.run(host='0.0.0.0', debug=True)