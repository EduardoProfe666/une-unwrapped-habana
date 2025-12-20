import os
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession

load_dotenv()
__api_id = int(os.getenv("API_ID"))
__api_hash = os.getenv("API_HASH")

def session_generator():
    """
        Prints out the session from Telegram (API_SESSION) according to API_ID and API_HASH
    """
    with TelegramClient(StringSession(), __api_id, __api_hash) as client:
        print("Your string session is:")
        print(client.session.save())

if __name__ == '__main__':
    session_generator()