import requests

def make_outbound_call(ngrok_url, phone_number):
    url = f"{ngrok_url}/outbound-call"
    agent_name = "Hope"
    business_name = "BigBoards"
    service_provided = "Motherboard Repair"
    user_name = "Daniil"
    
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
        "number": phone_number
    }
    
    headers = {
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        return True
    return False

# Example usage
if __name__ == "__main__":
    ngrok_url = "https://4350-31-94-34-31.ngrok-free.app"  # Replace with your actual ngrok URL
    phone_number = "+447341366667"  # Replace with the actual phone number
    
    success = make_outbound_call(ngrok_url, phone_number)
    if success:
        print("Call initiated successfully")
    else:
        print("Failed to initiate call") 