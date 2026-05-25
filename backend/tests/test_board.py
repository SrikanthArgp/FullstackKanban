from fastapi.testclient import TestClient

from app.main import create_app


def test_get_board_seeds_default(tmp_path) -> None:
    db_path = tmp_path / "kanban-test.db"
    app = create_app(db_path)

    with TestClient(app) as client:
        response = client.get("/api/board")
        assert response.status_code == 200

        payload = response.json()
        assert len(payload["columns"]) == 5
        assert len(payload["cards"]) == 8


def test_put_board_persists(tmp_path) -> None:
    db_path = tmp_path / "kanban-test.db"
    app = create_app(db_path)

    with TestClient(app) as client:
        payload = client.get("/api/board").json()
        payload["columns"][0]["title"] = "Backlog Updated"

        new_card = {"id": "card-999", "title": "New item", "details": "Fresh"}
        payload["cards"][new_card["id"]] = new_card
        payload["columns"][0]["cardIds"].append(new_card["id"])

        update_response = client.put("/api/board", json=payload)
        assert update_response.status_code == 200

    with TestClient(create_app(db_path)) as fresh_client:
        refreshed = fresh_client.get("/api/board").json()

    assert refreshed["columns"][0]["title"] == "Backlog Updated"
    assert any(card["title"] == "New item" for card in refreshed["cards"].values())
