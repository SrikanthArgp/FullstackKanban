import json as json_module

import pytest
from fastapi.testclient import TestClient
from pydantic import ValidationError

from app.main import create_app
from app.models.ai import AIResponse
from app.routes import ai as ai_routes


def test_ai_response_rejects_extra_fields() -> None:
    with pytest.raises(ValidationError):
        AIResponse.model_validate(
            {"message": "ok", "updates": None, "unexpected": "value"}
        )


def test_ai_structured_applies_board_update(monkeypatch, tmp_path) -> None:
    db_path = tmp_path / "kanban-test.db"
    app = create_app(db_path)

    with TestClient(app) as client:
        original_board = client.get("/api/board").json()

        updated_board = json_module.loads(json_module.dumps(original_board))
        updated_board["columns"][0]["title"] = "Backlog AI"

        ai_payload = {
            "message": "Renamed the first column.",
            "updates": {"board": updated_board},
        }

        def fake_post(url, headers=None, json=None, timeout=None):
            assert url == "https://openrouter.ai/api/v1/chat/completions"
            assert json["messages"][0]["role"] == "system"
            assert json["messages"][1]["role"] == "user"

            class StubResponse:
                def raise_for_status(self) -> None:
                    return None

                def json(self):
                    return {
                        "choices": [
                            {
                                "message": {
                                    "content": json_module.dumps(ai_payload)
                                }
                            }
                        ]
                    }

            return StubResponse()

        monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
        monkeypatch.setenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        monkeypatch.setenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
        monkeypatch.setattr(ai_routes.httpx, "post", fake_post)

        response = client.post(
            "/api/ai",
            json={"question": "Rename backlog", "board": original_board, "history": []},
        )

        assert response.status_code == 200
        payload = response.json()
        assert payload["updates"]["board"]["columns"][0]["title"] == "Backlog AI"

        refreshed = client.get("/api/board").json()
        assert refreshed["columns"][0]["title"] == "Backlog AI"