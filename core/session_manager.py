import os
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.sessions import StringSession

load_dotenv()


def session_generator():
    """
        Prints out the session from Telegram (API_SESSION) according to API_ID and API_HASH.
        Reads env vars lazily so importing this module doesn't require Telegram secrets.
    """
    api_id_raw = os.getenv("API_ID")
    api_hash = os.getenv("API_HASH")
    if not api_id_raw or not api_hash:
        raise RuntimeError(
            "API_ID and API_HASH must be set to generate a session."
        )
    api_id = int(api_id_raw)
    with TelegramClient(StringSession(), api_id, api_hash) as client:
        print("Your string session is:")
        print(client.session.save())

if __name__ == '__main__':
    session_generator()
