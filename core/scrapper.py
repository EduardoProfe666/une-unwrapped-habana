from telethon.sessions import StringSession
from telethon.sync import TelegramClient
import pytz
from core.database import setup_database, save_message_to_db
from core.classes import TelegramMessage
import os
from dotenv import load_dotenv

load_dotenv()
__api_id = int(os.getenv("API_ID"))
__api_hash = os.getenv("API_HASH")
__api_session = os.getenv("API_SESSION")
__phone = os.getenv("PHONE")
__channel_username = os.getenv("CHANNEL_USERNAME")
__session = StringSession(__api_session) if __api_session else 'session_name'

def process_all_messages():
    """
    Process all messages from telegram channel and store them on database
    """
    conn = setup_database()

    with TelegramClient(__session, __api_id, __api_hash) as client:
        for message in client.iter_messages(__channel_username, reverse=True):
            __process_message(conn, message)
        conn.close()

def process_latest_messages():
    """
    Process latest 25 messages from telegram channel and store them on database
    """
    conn = setup_database()
    with TelegramClient(__session, __api_id, __api_hash) as client:
        messages = client.get_messages(__channel_username, limit=25)

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