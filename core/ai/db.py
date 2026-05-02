"""
Persistence layer for AI analysis results.

Owns the `message_ai_analysis` table: schema creation, bulk save, pending lookup
and per-year retrieval used by the analyzer to enrich the yearly JSONs.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from core.classes import MessageAIAnalysis


SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS message_ai_analysis (
    message_id              INTEGER PRIMARY KEY,
    category                TEXT NOT NULL,
    category_confidence     REAL NOT NULL DEFAULT 0,
    subcategories           TEXT,
    sen_status              TEXT,
    affected_blocks         TEXT,
    recovered_blocks        TEXT,
    affected_provinces      TEXT,
    affected_municipalities TEXT,
    mentioned_circuits      TEXT,
    mentioned_units         TEXT,
    power_demand_mw         INTEGER,
    power_availability_mw   INTEGER,
    power_deficit_mw        INTEGER,
    peak_forecast_mw        INTEGER,
    mentioned_times         TEXT,
    severity                TEXT,
    event_type              TEXT,
    summary                 TEXT,
    raw_features            TEXT,
    model_version           TEXT NOT NULL,
    ai_failed               INTEGER NOT NULL DEFAULT 0,
    ai_error                TEXT,
    processed_at            TEXT NOT NULL,
    FOREIGN KEY (message_id) REFERENCES messages (id)
);
"""

INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_ai_category      ON message_ai_analysis(category);",
    "CREATE INDEX IF NOT EXISTS idx_ai_event_type    ON message_ai_analysis(event_type);",
    "CREATE INDEX IF NOT EXISTS idx_ai_severity      ON message_ai_analysis(severity);",
    "CREATE INDEX IF NOT EXISTS idx_ai_sen_status    ON message_ai_analysis(sen_status);",
    "CREATE INDEX IF NOT EXISTS idx_ai_model_version ON message_ai_analysis(model_version);",
    "CREATE INDEX IF NOT EXISTS idx_ai_processed_at  ON message_ai_analysis(processed_at);",
]


def setup_ai_table(conn: sqlite3.Connection) -> None:
    """Idempotently create the AI analysis table and its indexes."""
    cursor = conn.cursor()
    cursor.execute(SCHEMA_SQL)
    for stmt in INDEX_STATEMENTS:
        cursor.execute(stmt)
    conn.commit()


def _dump_json(value) -> str | None:
    if value is None:
        return None
    if isinstance(value, str):
        return value
    return json.dumps(value, ensure_ascii=False)


def _load_json(raw: str | None, default):
    if raw is None or raw == "":
        return default
    try:
        return json.loads(raw)
    except (json.JSONDecodeError, TypeError):
        return default


def save_ai_analyses(conn: sqlite3.Connection, analyses: list["MessageAIAnalysis"]) -> int:
    """Bulk INSERT OR REPLACE. Returns number of rows written."""
    if not analyses:
        return 0

    rows = []
    for a in analyses:
        rows.append(
            (
                a.message_id,
                a.category,
                float(a.category_confidence or 0),
                _dump_json(a.subcategories),
                a.sen_status,
                _dump_json(a.affected_blocks),
                _dump_json(a.recovered_blocks),
                _dump_json(a.affected_provinces),
                _dump_json(a.affected_municipalities),
                _dump_json(a.mentioned_circuits),
                _dump_json(a.mentioned_units),
                a.power_demand_mw,
                a.power_availability_mw,
                a.power_deficit_mw,
                a.peak_forecast_mw,
                _dump_json(a.mentioned_times),
                a.severity,
                a.event_type,
                a.summary,
                _dump_json(a.raw_features),
                a.model_version,
                int(bool(a.ai_failed)),
                a.ai_error,
                a.processed_at if isinstance(a.processed_at, str) else a.processed_at.isoformat(),
            )
        )

    cursor = conn.cursor()
    cursor.executemany(
        """
        INSERT OR REPLACE INTO message_ai_analysis (
            message_id, category, category_confidence, subcategories,
            sen_status, affected_blocks, recovered_blocks,
            affected_provinces, affected_municipalities,
            mentioned_circuits, mentioned_units,
            power_demand_mw, power_availability_mw, power_deficit_mw, peak_forecast_mw,
            mentioned_times, severity, event_type, summary, raw_features,
            model_version, ai_failed, ai_error, processed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        rows,
    )
    conn.commit()
    return len(rows)


def get_pending_message_ids(
    conn: sqlite3.Connection,
    model_version: str,
    limit: int | None = None,
    year: int | None = None,
) -> list[int]:
    """
    Returns message ids that either:
    - have no row in message_ai_analysis, or
    - have a row with model_version != current_version (meaning taxonomy/model changed).
    Optionally filter by year (matches first 4 chars of date_cuba) and cap with `limit`.
    """
    cursor = conn.cursor()
    params: list = [model_version]
    sql = """
        SELECT m.id
        FROM messages m
        LEFT JOIN message_ai_analysis a ON a.message_id = m.id
        WHERE m.text IS NOT NULL AND m.text <> ''
          AND (a.message_id IS NULL OR a.model_version != ?)
    """
    if year is not None:
        sql += " AND m.date_cuba LIKE ?"
        params.append(f"{year}%")
    sql += " ORDER BY m.id ASC"
    if limit is not None:
        sql += " LIMIT ?"
        params.append(limit)

    cursor.execute(sql, params)
    return [row[0] for row in cursor.fetchall()]


def get_ai_analyses_by_year(year: int) -> dict[int, "MessageAIAnalysis"]:
    """
    Loads all AI analyses for a given year (joined to messages by date_cuba prefix).
    Returns a dict keyed by message_id. Returns empty dict if table is absent.
    """
    from core.classes import MessageAIAnalysis  # local import to avoid cycles

    conn = sqlite3.connect("telegram_messages.db")
    try:
        cursor = conn.cursor()
        # Ensure the table exists (no-op if it does); avoids errors on first run.
        setup_ai_table(conn)

        cursor.execute(
            """
            SELECT a.message_id, a.category, a.category_confidence, a.subcategories,
                   a.sen_status, a.affected_blocks, a.recovered_blocks,
                   a.affected_provinces, a.affected_municipalities,
                   a.mentioned_circuits, a.mentioned_units,
                   a.power_demand_mw, a.power_availability_mw, a.power_deficit_mw, a.peak_forecast_mw,
                   a.mentioned_times, a.severity, a.event_type, a.summary, a.raw_features,
                   a.model_version, a.ai_failed, a.ai_error, a.processed_at
            FROM message_ai_analysis a
            JOIN messages m ON m.id = a.message_id
            WHERE m.date_cuba LIKE ?
            """,
            (f"{year}%",),
        )

        out: dict[int, MessageAIAnalysis] = {}
        for row in cursor.fetchall():
            out[row[0]] = MessageAIAnalysis(
                message_id=row[0],
                category=row[1] or "general_info",
                category_confidence=row[2] or 0.0,
                subcategories=_load_json(row[3], []),
                sen_status=row[4],
                affected_blocks=_load_json(row[5], []),
                recovered_blocks=_load_json(row[6], []),
                affected_provinces=_load_json(row[7], []),
                affected_municipalities=_load_json(row[8], []),
                mentioned_circuits=_load_json(row[9], []),
                mentioned_units=_load_json(row[10], []),
                power_demand_mw=row[11],
                power_availability_mw=row[12],
                power_deficit_mw=row[13],
                peak_forecast_mw=row[14],
                mentioned_times=_load_json(row[15], []),
                severity=row[16],
                event_type=row[17],
                summary=row[18] or "",
                raw_features=_load_json(row[19], {}),
                model_version=row[20] or "",
                ai_failed=bool(row[21]),
                ai_error=row[22],
                processed_at=row[23] or "",
            )
        return out
    finally:
        conn.close()


def count_ai_analyses(conn: sqlite3.Connection) -> tuple[int, int]:
    """Returns (total_rows, failed_rows)."""
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*), SUM(ai_failed) FROM message_ai_analysis")
    row = cursor.fetchone()
    return (row[0] or 0, row[1] or 0)


def fetch_messages_for_ai(conn: sqlite3.Connection, ids: list[int]) -> list[dict]:
    """Loads message text and date for processing. Returns list of dicts."""
    if not ids:
        return []
    placeholders = ",".join("?" for _ in ids)
    cursor = conn.cursor()
    cursor.execute(
        f"""
        SELECT id, date_utc, date_cuba, views, replies, text
        FROM messages
        WHERE id IN ({placeholders})
        """,
        ids,
    )
    return [
        {
            "id": row[0],
            "date_utc": row[1] or "",
            "date_cuba": row[2] or "",
            "views": row[3] or 0,
            "replies": row[4] or 0,
            "text": row[5] or "",
        }
        for row in cursor.fetchall()
    ]
