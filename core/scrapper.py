from telethon.sessions import StringSession
from telethon.sync import TelegramClient
import pytz
from core.database import setup_database, save_message_to_db
from core.classes import TelegramMessage
import os
from dotenv import load_dotenv

load_dotenv()


def _telegram_credentials():
    """
    Read Telegram credentials lazily so the module is importable in workflows
    that don't have these secrets (e.g. backfill-ai.yml). Raises a clear error
    only when a function that actually needs Telegram is invoked.
    """
    api_id_raw = os.getenv("API_ID")
    api_hash = os.getenv("API_HASH")
    api_session = os.getenv("API_SESSION")
    phone = os.getenv("PHONE")
    channel_username = os.getenv("CHANNEL_USERNAME")

    if not api_id_raw:
        raise RuntimeError(
            "API_ID env var is missing. Telegram functions require API_ID, API_HASH, "
            "API_SESSION, PHONE and CHANNEL_USERNAME secrets."
        )

    api_id = int(api_id_raw)
    session = StringSession(api_session) if api_session else 'session_name'
    return api_id, api_hash, session, phone, channel_username


def _channel_username() -> str:
    """Lightweight accessor used by code that only needs the channel name (e.g. links)."""
    return os.getenv("CHANNEL_USERNAME") or ""


def process_all_messages():
    """
    Process all messages from telegram channel and store them on database
    """
    api_id, api_hash, session, _phone, channel_username = _telegram_credentials()
    conn = setup_database()

    with TelegramClient(session, api_id, api_hash) as client:
        for message in client.iter_messages(channel_username, reverse=True):
            __process_message(conn, message)
        conn.close()

def process_latest_messages():
    """
    Process latest 50 messages from telegram channel and store them on database
    """
    api_id, api_hash, session, _phone, channel_username = _telegram_credentials()
    conn = setup_database()
    with TelegramClient(session, api_id, api_hash) as client:
        messages = client.get_messages(channel_username, limit=50)

        for message in messages:
            __process_message(conn, message)
    conn.close()

def __process_message(conn, message):
    reactions = {}
    if hasattr(message, 'reactions') and hasattr(message.reactions, 'results'):
        for reaction in message.reactions.results:
            emoji = reaction.reaction.emoticon
            count = reaction.count
            reactions[emoji] = count

    views = getattr(message, 'views', 0)
    replies_count = 0
    print(message)
    if hasattr(message, 'replies') and message.replies:
        replies_count = message.replies.replies

    utc_time = message.date
    cuba_tz = pytz.timezone('America/Havana')
    cuba_time = utc_time.astimezone(cuba_tz)
    cuba_date = cuba_time.strftime("%Y-%m-%d %H:%M:%S")

    msg = TelegramMessage(
        id=message.id,
        date_utc=message.date.strftime("%Y-%m-%d %H:%M:%S"),
        date_cuba=cuba_date,
        reactions=reactions,
        views=views,
        replies=replies_count,
        text=message.text
    )
    save_message_to_db(conn, msg)
    print(msg)
