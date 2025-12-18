import sqlite3

from core.classes import TelegramMessage
from core.utils import datestr_to_datetime

import os
from dotenv import load_dotenv

load_dotenv()
__channel_username = os.getenv("CHANNEL_USERNAME")

def setup_database():
    """
    Setup database by creating the corresponding tables.

    **REMEMBER TO CLOSE CONNECTION TO DATABASE**
    :return: sqlite connection
    """
    conn = sqlite3.connect('telegram_messages.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY,
            date_utc TEXT,
            date_cuba TEXT,
            views INTEGER,
            replies INTEGER,
            text TEXT
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS message_reactions (
            message_id INTEGER,
            emoji TEXT,
            count INTEGER,
            PRIMARY KEY (message_id, emoji),
            FOREIGN KEY (message_id) REFERENCES messages (id)
        )
    ''')
    conn.commit()
    return conn


def save_message_to_db(conn, msg: TelegramMessage):
    """
    Saves message to database by replacing it if exists.

    :param conn: sqlite connection
    :param msg: the `TelegramMessage` object
    """

    print(f'\n\nSaving message to database {msg.id}\n')
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT OR REPLACE INTO messages (id, date_utc, date_cuba, views, replies, text)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (msg.id, msg.date_utc, msg.date_cuba, msg.views, msg.replies, msg.text))

        for emoji, count in msg.reactions.items():
            cursor.execute('''
                INSERT OR REPLACE INTO message_reactions (message_id, emoji, count)
                VALUES (?, ?, ?)
            ''', (msg.id, emoji, count))

        conn.commit()
    except Exception as e:
        print(e)

def get_messages_by_year(year: int) -> list[TelegramMessage]:
    """
        Get all messsages from db to In-Memory from a determined year.

        :param year: year of analysis
        :return: list of `TelegramMessage` objects
    """
    messages = []
    conn = setup_database()
    cursor = conn.cursor()
    search_pattern = f"{year}%"

    print(f'\n\nRetrieving messages for year {year}.')

    cursor.execute('''
                   SELECT id, date_utc, date_cuba, views, replies, text
                   FROM messages
                   WHERE date_cuba LIKE ?
                   ''', (search_pattern,))
    rows = cursor.fetchall()
    messages_dict: dict[int, TelegramMessage] = {}

    for row in rows:
        msg = TelegramMessage(
            id=row[0],
            date_utc=row[1],
            date_cuba=row[2],
            views=row[3],
            replies=row[4],
            text=row[5],
            reactions={}
        )
        messages_dict[msg.id] = msg

    cursor.execute('''
                   SELECT message_id, emoji, count
                   FROM message_reactions
                   WHERE message_id IN (SELECT id
                                        FROM messages
                                        WHERE date_cuba LIKE ?)
                   ''', (search_pattern,))
    reaction_rows = cursor.fetchall()

    for m_id, emoji, count in reaction_rows:
        if m_id in messages_dict:
            messages_dict[m_id].reactions[emoji] = count

    print(f'Finished retrieval. Found {len(messages_dict)} messages for year {year}.')
    conn.close()

    data = list(messages_dict.values())

    for msg in data:
        msg.date_utc = msg.date_utc or ""
        msg.date_cuba = msg.date_cuba or ""
        msg.views = msg.views or 0
        msg.replies = msg.replies or 0
        msg.text = msg.text or ""
        msg.reactions = msg.reactions or {}
        msg.date_utc_d = datestr_to_datetime(msg.date_utc)
        msg.date_cuba_d = datestr_to_datetime(msg.date_cuba)
        msg.link = construct_link_by_id(msg.id)

    return data

def construct_link_by_id(message_id):
    return f"https://t.me/{__channel_username}/{message_id}"