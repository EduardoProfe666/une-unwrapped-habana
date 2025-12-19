import os
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession

load_dotenv()
__api_id = int(os.getenv("API_ID"))
__api_hash = os.getenv("API_HASH")

def session_generator():
    with TelegramClient(StringSession(), __api_id, __api_hash) as client:
        print("Your string session is:")
        print(client.session.save())