from pathlib import Path

from .. import db
from ..models.kanban import BoardModel


def get_board(db_path: Path) -> BoardModel:
    db.ensure_default_board(db_path)
    return db.fetch_board(db_path)


def update_board(db_path: Path, board: BoardModel) -> BoardModel:
    db.ensure_default_board(db_path)
    return db.replace_board_data(db_path, board)
