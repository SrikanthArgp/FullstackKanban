from fastapi.testclient import TestClient

from app.main import create_app
from app.routes import ai


def test_ai_test_endpoint(monkeypatch) -> None:
    def fake_post(url, headers=None, json=None, timeout=None):
        assert url == "https://openrouter.ai/api/v1/chat/completions"
        assert json["model"] == "openai/gpt-oss-120b:free"
        assert json["messages"][0]["content"].startswith("What is 2+2")

        class StubResponse:
            def __init__(self) -> None:
                self.status_code = 200

            def raise_for_status(self) -> None:
                return None

            def json(self):
                return {"choices": [{"message": {"content": "4"}}]}

        return StubResponse()

    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")
    monkeypatch.setenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
    monkeypatch.setenv("OPENROUTER_MODEL", "openai/gpt-oss-120b:free")
    monkeypatch.setattr(ai.httpx, "post", fake_post)

    app = create_app()
    with TestClient(app) as client:
        response = client.get("/api/ai/test")

    assert response.status_code == 200
    assert response.json() == {"message": "4", "model": "openai/gpt-oss-120b:free"}
