import os
from make_outbound_call import make_outbound_call
from dotenv import load_dotenv

def main():
    # Load environment variables from .env file
    load_dotenv()
    
    # Configuration
    ngrok_url = "https://8d0e-77-241-76-112.ngrok-free.app"
    phone_number = "+447341366667"
    agent_name = "Hope"
    business_name = "BigBoards"
    service_provided = "Motherboard Repair"
    user_name = "Vladimir"
    
    # Make the outbound call
    success, conversation_id = make_outbound_call(ngrok_url, phone_number, agent_name, business_name, service_provided, user_name)
    
    if success:
        print(f"Call initiated successfully. Conversation ID: {conversation_id}")
    else:
        print("Failed to initiate call")

if __name__ == "__main__":
    main()
