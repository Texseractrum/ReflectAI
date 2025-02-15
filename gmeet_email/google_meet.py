import time
import undetected_chromedriver as uc
from selenium.webdriver.common.by import By


def main():
    # -----------------------------
    # 1) Set up undetected_chromedriver with your profile
    # -----------------------------
    options = uc.ChromeOptions()

    # Where your Chrome user data folder is stored (the parent containing multiple profiles)
    # Example for macOS:
    options.add_argument("--user-data-dir=/Users/vladimir/Library/Application Support/Google/Chrome")

    # Which subfolder profile to load (e.g., "Profile 25")
    options.add_argument("--profile-directory=Profile 25")

    # If your Chrome version is 133, specify version_main=133
    # (adjust as needed, or omit if UC autodetects fine).
    driver = uc.Chrome(options=options, version_main=133)

    # Confirm you're using the expected profile:
    # driver.get("chrome://version")
    # time.sleep(5)
    # (Check "Profile Path" in the console output, then proceed.)

    # -----------------------------
    # 2) Create a new Google Meet
    # -----------------------------
    time.sleep(5)
    print("we are here")
    driver.get("https://meet.google.com/landing")
    time.sleep(5)  # Wait for landing page to load

    # Click "New meeting"
    try:
        new_meeting_btn = driver.find_element(By.XPATH, "//span[contains(text(), 'New meeting')]")
        new_meeting_btn.click()
        time.sleep(2)
    except Exception as e:
        print("Could not find 'New meeting' button:", e)
        return

    # Click "Start an instant meeting"
    try:
        start_instant_btn = driver.find_element(By.XPATH, "//span[contains(text(), 'Start an instant meeting')]")
        start_instant_btn.click()
        time.sleep(5)  # Wait for redirect
    except Exception as e:
        print("Could not find 'Start an instant meeting' button:", e)
        return

    # The new meeting URL (once the page loads)
    new_meet_url = driver.current_url
    print(f"[INFO] New Meeting URL: {new_meet_url}")

    # -----------------------------
    # 3) (Optional) Turn off mic/cam
    # -----------------------------
    time.sleep(3)
    try:
        mic_button = driver.find_element(By.XPATH, "//div[@aria-label='Turn off microphone']")
        if mic_button:
            mic_button.click()
            print("Microphone turned off.")
    except:
        print("Mic button not found or already off.")

    time.sleep(1)
    try:
        cam_button = driver.find_element(By.XPATH, "//div[@aria-label='Turn off camera']")
        if cam_button:
            cam_button.click()
            print("Camera turned off.")
    except:
        print("Camera button not found or already off.")

    # -----------------------------
    # 4) Join the meeting (optional)
    # -----------------------------
    # If you just created the meeting, you might already be “inside” it in some contexts.
    # But typically you see a preview with a "Join now" button:

    time.sleep(2)
    try:
        join_now_button = driver.find_element(By.XPATH, "//span[text()='Join now']")
        join_now_button.click()
        print("Joined the meeting.")
    except:
        # Maybe it's "Ask to join" if it's a domain-based account
        try:
            ask_button = driver.find_element(By.XPATH, "//span[text()='Ask to join']")
            ask_button.click()
            print("Requested to join the meeting.")
        except:
            print("Neither 'Join now' nor 'Ask to join' button was found. Possibly already joined.")

    # You should now be in the active meeting. We’ll keep the browser open so you can see/verify it.
    print("\nPress ENTER in the console to close the browser and end script.")
    input()

    driver.quit()


if __name__ == "__main__":
    main()
