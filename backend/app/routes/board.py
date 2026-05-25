import logging
from fastapi import APIRouter, Request

from ..controllers import board_controller
from ..models.kanban import BoardModel

logger = logging.getLogger("backend")

router = APIRouter()


@router.get("/api/board", response_model=BoardModel)
def read_board(request: Request) -> BoardModel:
    logger.info("GET /api/board")
    db_path = request.app.state.db_path
    return board_controller.get_board(db_path)


@router.put("/api/board", response_model=BoardModel)
def update_board(board: BoardModel, request: Request) -> BoardModel:
    logger.info("PUT /api/board")
    db_path = request.app.state.db_path
    return board_controller.update_board(db_path, board)
