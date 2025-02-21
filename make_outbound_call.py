import requests


def make_outbound_call(
    ngrok_url, phone_number, agent_name, business_name, service_provided, user_name
):
    url = f"{ngrok_url}/outbound-call"

    payload = {
        "prompt": (
            f"You are a friendly, empathetic, and inquisitive AI assistant named {agent_name}, "
            f"working on behalf of {business_name}. The user, {user_name}, has joined a call "
            f"to provide feedback about a recent {service_provided} experience. Your goal is to "
            f"gather honest, detailed insights by focusing on real events and genuine challenges, "
            f"following The Mom Test principles. Maintain a warm, respectful tone, and be mindful "
            f"of the user's time."
        ),
        "first_message": f"Hello {user_name}, thanks for joining this call! I'm {agent_name} from {business_name}, and I appreciate you taking the time to share your thoughts about your recent {service_provided}. This isn't a sales call—just an opportunity to understand your experience so we can keep improving.",
        "number": phone_number,
    }

    headers = {"Content-Type": "application/json"}

    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        try:
            data = response.json()
            # Try to get conversation_id first, fall back to callSid if needed
            conversation_id = data.get("conversation_id") or data.get("callSid")
            if conversation_id:
                print(f"Debug - Full response: {data}")  # Debug line
                return True, conversation_id
            return False, None
        except (ValueError, AttributeError) as e:
            print(f"Error parsing response: {e}")  # Debug line
            return False, None
    print(f"Request failed with status code: {response.status_code}")  # Debug line
    return False, None


# Example usage
if __name__ == "__main__":
    ngrok_url = (
        "https://b27d-192-76-8-168.ngrok-free.app"  # Replace with your actual ngrok URL
    )
    phone_number = "+447454835946"  # Replace with the actual phone number
    agent_name = "Hope"
    business_name = "BigBoards"
    service_provided = "Motherboard Repair"
    user_name = "Vladimir"
    success, conversation_id = make_outbound_call(
        ngrok_url, phone_number, agent_name, business_name, service_provided, user_name
    )
    if success:
        print(f"Call initiated successfully. Conversation ID: {conversation_id}")
    else:
        print("Failed to initiate call")
