import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from .models.kanban import BoardModel

DEFAULT_USERNAME = "user"
DEFAULT_BOARD_NAME = "Kanban Board"

DEFAULT_BOARD: dict[str, object] = {
    "columns": [
        {"id": "col-backlog", "title": "Backlog", "cardIds": ["card-1", "card-2"]},
        {"id": "col-discovery", "title": "Discovery", "cardIds": ["card-3"]},
        {"id": "col-progress", "title": "In Progress", "cardIds": ["card-4", "card-5"]},
        {"id": "col-review", "title": "Review", "cardIds": ["card-6"]},
        {"id": "col-done", "title": "Done", "cardIds": ["card-7", "card-8"]},
    ],
    "cards": {
        "card-1": {
            "id": "card-1",
            "title": "Align roadmap themes",
            "details": "Draft quarterly themes with impact statements and metrics.",
        },
        "card-2": {
            "id": "card-2",
            "title": "Gather customer signals",
            "details": "Review support tags, sales notes, and churn feedback.",
        },
        "card-3": {
            "id": "card-3",
            "title": "Prototype analytics view",
            "details": "Sketch initial dashboard layout and key drill-downs.",
        },
        "card-4": {
            "id": "card-4",
            "title": "Refine status language",
            "details": "Standardize column labels and tone across the board.",
        },
        "card-5": {
            "id": "card-5",
            "title": "Design card layout",
            "details": "Add hierarchy and spacing for scanning dense lists.",
        },
        "card-6": {
            "id": "card-6",
            "title": "QA micro-interactions",
            "details": "Verify hover, focus, and loading states.",
        },
        "card-7": {
            "id": "card-7",
            "title": "Ship marketing page",
            "details": "Final copy approved and asset pack delivered.",
        },
        "card-8": {
            "id": "card-8",
            "title": "Close onboarding sprint",
            "details": "Document release notes and share internally.",
        },
    },
}

SCHEMA_SQL = """
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS boards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS columns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    board_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
    UNIQUE (board_id, position)
);

CREATE TABLE IF NOT EXISTS cards (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    column_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (column_id) REFERENCES columns(id) ON DELETE CASCADE,
    UNIQUE (column_id, position)
);

CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
CREATE INDEX IF NOT EXISTS idx_cards_column_id ON cards(column_id);
"""


def get_db_path(explicit_path: Path | None = None) -> Path:
    if explicit_path is not None:
        return explicit_path
    env_path = os.getenv("KANBAN_DB_PATH")
    if env_path:
        return Path(env_path)
    return Path(__file__).resolve().parent / "data" / "kanban.db"


def connect(db_path: Path) -> sqlite3.Connection:
    connection = sqlite3.connect(db_path)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys = ON")
    return connection


def init_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with connect(db_path) as connection:
        connection.executescript(SCHEMA_SQL)


def ensure_default_board(db_path: Path) -> None:
    with connect(db_path) as connection:
        now = _now_iso()
        connection.execute(
            "INSERT OR IGNORE INTO users (username, created_at) VALUES (?, ?)",
            (DEFAULT_USERNAME, now),
        )
        user_row = connection.execute(
            "SELECT id FROM users WHERE username = ?",
            (DEFAULT_USERNAME,),
        ).fetchone()
        if user_row is None:
            raise RuntimeError("Unable to ensure default user")
        user_id = int(user_row["id"])

        connection.execute(
            "INSERT OR IGNORE INTO boards (user_id, name, created_at) VALUES (?, ?, ?)",
            (user_id, DEFAULT_BOARD_NAME, now),
        )
        board_row = connection.execute(
            "SELECT id FROM boards WHERE user_id = ?",
            (user_id,),
        ).fetchone()
        if board_row is None:
            raise RuntimeError("Unable to ensure default board")
        board_id = int(board_row["id"])

        column_row = connection.execute(
            "SELECT id FROM columns WHERE board_id = ? LIMIT 1",
            (board_id,),
        ).fetchone()
        if column_row is not None:
            return

    replace_board_data(db_path, BoardModel.model_validate(DEFAULT_BOARD), board_id)


def fetch_board(db_path: Path) -> BoardModel:
    with connect(db_path) as connection:
        board_id = _get_default_board_id(connection)
        columns_rows = connection.execute(
            "SELECT id, name, position FROM columns WHERE board_id = ? ORDER BY position",
            (board_id,),
        ).fetchall()

        cards: dict[str, dict[str, str]] = {}
        columns = []
        for column_row in columns_rows:
            column_id = int(column_row["id"])
            column_external_id = _format_external_id("col", column_id)
            card_rows = connection.execute(
                "SELECT id, title, description, position FROM cards "
                "WHERE column_id = ? ORDER BY position",
                (column_id,),
            ).fetchall()

            card_ids: list[str] = []
            for card_row in card_rows:
                card_id = int(card_row["id"])
                card_external_id = _format_external_id("card", card_id)
                card_ids.append(card_external_id)
                cards[card_external_id] = {
                    "id": card_external_id,
                    "title": card_row["title"],
                    "details": card_row["description"] or "",
                }

            columns.append(
                {
                    "id": column_external_id,
                    "title": column_row["name"],
                    "cardIds": card_ids,
                }
            )

    return BoardModel.model_validate({"columns": columns, "cards": cards})


def replace_board_data(
    db_path: Path,
    board: BoardModel,
    board_id: int | None = None,
) -> BoardModel:
    with connect(db_path) as connection:
        if board_id is None:
            board_id = _get_default_board_id(connection)

        connection.execute(
            "DELETE FROM cards WHERE column_id IN "
            "(SELECT id FROM columns WHERE board_id = ?)",
            (board_id,),
        )
        connection.execute(
            "DELETE FROM columns WHERE board_id = ?",
            (board_id,),
        )

        column_id_map: dict[str, int] = {}
        now = _now_iso()

        for position, column in enumerate(board.columns):
            explicit_id = _parse_external_id(column.id, "col")
            if explicit_id is not None:
                connection.execute(
                    "INSERT INTO columns (id, board_id, name, position, created_at) "
                    "VALUES (?, ?, ?, ?, ?)",
                    (explicit_id, board_id, column.title, position, now),
                )
                column_db_id = explicit_id
            else:
                cursor = connection.execute(
                    "INSERT INTO columns (board_id, name, position, created_at) "
                    "VALUES (?, ?, ?, ?)",
                    (board_id, column.title, position, now),
                )
                column_db_id = int(cursor.lastrowid)

            column_id_map[column.id] = column_db_id

        for column in board.columns:
            column_db_id = column_id_map[column.id]
            for position, card_id in enumerate(column.cardIds):
                card = board.cards.get(card_id)
                if card is None:
                    continue

                explicit_card_id = _parse_external_id(card.id, "card")
                if explicit_card_id is not None:
                    connection.execute(
                        "INSERT INTO cards (id, column_id, title, description, position, "
                        "created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                        (
                            explicit_card_id,
                            column_db_id,
                            card.title,
                            card.details,
                            position,
                            now,
                            now,
                        ),
                    )
                else:
                    connection.execute(
                        "INSERT INTO cards (column_id, title, description, position, "
                        "created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
                        (
                            column_db_id,
                            card.title,
                            card.details,
                            position,
                            now,
                            now,
                        ),
                    )

    return fetch_board(db_path)


def _get_default_board_id(connection: sqlite3.Connection) -> int:
    board_row = connection.execute(
        "SELECT id FROM boards WHERE user_id = "
        "(SELECT id FROM users WHERE username = ?)",
        (DEFAULT_USERNAME,),
    ).fetchone()
    if board_row is None:
        raise RuntimeError("Default board missing; ensure_default_board was not called")
    return int(board_row["id"])


def _parse_external_id(value: str, prefix: str) -> int | None:
    if not value.startswith(f"{prefix}-"):
        return None
    numeric = value[len(prefix) + 1 :]
    if not numeric.isdigit():
        return None
    return int(numeric)


def _format_external_id(prefix: str, raw_id: int) -> str:
    return f"{prefix}-{raw_id}"


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()
