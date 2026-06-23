
from fastapi.testclient import TestClient

_GAME_STATE = {
    "snake": [{"x": 5, "y": 5}, {"x": 4, "y": 5}],
    "food": {"x": 10, "y": 10},
    "direction": "right",
    "mode": "walls",
    "score": 0,
    "alive": True,
    "tick": 1,
}


def test_list_active_games_empty(client: TestClient) -> None:
    r = client.get("/api/games/active")
    assert r.status_code == 200
    assert r.json() == []


def test_publish_game(auth_client: tuple) -> None:
    client, headers = auth_client
    r = client.put("/api/games/active", json=_GAME_STATE, headers=headers)
    assert r.status_code == 200
    body = r.json()
    assert body["username"] == "tester"
    assert body["mode"] == "walls"
    assert body["state"]["tick"] == 1


def test_publish_game_appears_in_list(auth_client: tuple) -> None:
    client, headers = auth_client
    client.put("/api/games/active", json=_GAME_STATE, headers=headers)

    r = client.get("/api/games/active")
    assert r.status_code == 200
    games = r.json()
    assert len(games) == 1
    assert games[0]["username"] == "tester"


def test_publish_game_upserts(auth_client: tuple) -> None:
    client, headers = auth_client
    client.put("/api/games/active", json=_GAME_STATE, headers=headers)
    updated = {**_GAME_STATE, "score": 99, "tick": 10}
    client.put("/api/games/active", json=updated, headers=headers)

    r = client.get("/api/games/active")
    games = r.json()
    assert len(games) == 1
    assert games[0]["state"]["score"] == 99


def test_end_game(auth_client: tuple) -> None:
    client, headers = auth_client
    client.put("/api/games/active", json=_GAME_STATE, headers=headers)
    r = client.delete("/api/games/active", headers=headers)
    assert r.status_code == 204

    r2 = client.get("/api/games/active")
    assert r2.json() == []


def test_end_game_idempotent(auth_client: tuple) -> None:
    client, headers = auth_client
    r = client.delete("/api/games/active", headers=headers)
    assert r.status_code == 204


def test_publish_game_unauthenticated(client: TestClient) -> None:
    r = client.put("/api/games/active", json=_GAME_STATE)
    assert r.status_code == 401


def test_end_game_unauthenticated(client: TestClient) -> None:
    r = client.delete("/api/games/active")
    assert r.status_code == 401
