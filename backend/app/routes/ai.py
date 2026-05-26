import json
import logging
import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger("backend")

from ..controllers import board_controller
from ..models.ai import AIRequest, AIResponse, AIUpdate

router = APIRouter()

DEFAULT_BASE_URL = "https://openrouter.ai/api/v1"
DEFAULT_MODEL = "openai/gpt-oss-120b:free"


def _get_base_url() -> str:
    return os.getenv("OPENROUTER_BASE_URL", DEFAULT_BASE_URL)


def _get_model() -> str:
    return os.getenv("OPENROUTER_MODEL", DEFAULT_MODEL)


def _get_api_key() -> str:
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OpenRouter API key not configured")
    return api_key


def _request_openrouter_messages(messages: list[dict[str, str]]) -> dict[str, Any]:
    api_key = _get_api_key()
    url = f"{_get_base_url()}/chat/completions"
    payload = {
        "model": _get_model(),
        "messages": messages,
    }
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "X-Title": "pm-main-kanban",
    }

    response = httpx.post(url, headers=headers, json=payload, timeout=20.0)
    response.raise_for_status()
    return response.json()


def _extract_content(response_json: dict[str, Any]) -> str:
    try:
        return response_json["choices"][0]["message"]["content"].strip()
    except (KeyError, IndexError, AttributeError, TypeError) as exc:
        raise HTTPException(
            status_code=502, detail="Unexpected OpenRouter response"
        ) from exc


def _build_ai_messages(request: AIRequest) -> list[dict[str, str]]:
    schema = json.dumps(AIResponse.model_json_schema(), indent=2)
    history_payload = [message.model_dump() for message in request.history]
    board_payload = request.board.model_dump()
    user_content = (
        "You are a Kanban assistant. Use the board state to answer the question. "
        "If updates are needed, include the full updated board in updates.board.\n\n"
        f"Question:\n{request.question}\n\n"
        f"Board JSON:\n{json.dumps(board_payload, indent=2)}\n\n"
        f"History:\n{json.dumps(history_payload, indent=2)}\n\n"
        "Return JSON only that matches the provided schema."
    )
    return [
        {
            "role": "system",
            "content": "Return JSON only that matches this schema:\n" + schema,
        },
        {"role": "user", "content": user_content},
    ]


def _parse_ai_response(content: str) -> AIResponse:
    try:
        payload = json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="AI response was not valid JSON") from exc

    try:
        return AIResponse.model_validate(payload)
    except Exception as exc:
        raise HTTPException(status_code=502, detail="AI response did not match schema") from exc


def _apply_updates(db_path, updates: AIUpdate | None) -> AIUpdate | None:
    if updates is None or updates.board is None:
        return updates

    updated_board = board_controller.update_board(db_path, updates.board)
    return updates.model_copy(update={"board": updated_board})


@router.get("/api/ai/test")
def ai_test() -> dict[str, str]:
    logger.info("GET /api/ai/test")
    response_json = _request_openrouter_messages(
        [{"role": "user", "content": "What is 2+2? Respond with only the number."}]
    )
    return {"message": _extract_content(response_json), "model": _get_model()}


@router.post("/api/ai", response_model=AIResponse)
def ai_structured(request_body: AIRequest, request: Request) -> AIResponse:
    logger.info("POST /api/ai")
    response_json = _request_openrouter_messages(_build_ai_messages(request_body))
    content = _extract_content(response_json)
    ai_response = _parse_ai_response(content)
    ai_response = ai_response.model_copy(
        update={"updates": _apply_updates(request.app.state.db_path, ai_response.updates)}
    )
    return ai_response
