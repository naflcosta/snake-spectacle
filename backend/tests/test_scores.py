
from fastapi.testclient import TestClient


def test_submit_score(auth_client: tuple) -> None:
    client, headers = auth_client
    r = client.post("/api/scores", json={"mode": "walls", "score": 42}, headers=headers)
    assert r.status_code == 201
    body = r.json()
    assert body["score"] == 42
    assert body["mode"] == "walls"
    assert body["username"] == "tester"


def test_submit_score_unauthenticated(client: TestClient) -> None:
    r = client.post("/api/scores", json={"mode": "walls", "score": 10})
    assert r.status_code == 401


def test_leaderboard_returns_scores(auth_client: tuple) -> None:
    client, headers = auth_client
    client.post("/api/scores", json={"mode": "walls", "score": 10}, headers=headers)
    client.post("/api/scores", json={"mode": "walls", "score": 50}, headers=headers)
    client.post("/api/scores", json={"mode": "wrap", "score": 99}, headers=headers)

    r = client.get("/api/leaderboard?mode=walls")
    assert r.status_code == 200
    scores = r.json()
    assert len(scores) == 2
    # sorted descending
    assert scores[0]["score"] >= scores[1]["score"]


def test_leaderboard_mode_filter(auth_client: tuple) -> None:
    client, headers = auth_client
    client.post("/api/scores", json={"mode": "wrap", "score": 77}, headers=headers)

    r = client.get("/api/leaderboard?mode=walls")
    assert r.status_code == 200
    assert r.json() == []


def test_leaderboard_limit(auth_client: tuple) -> None:
    client, headers = auth_client
    for i in range(5):
        client.post("/api/scores", json={"mode": "walls", "score": i * 10}, headers=headers)

    r = client.get("/api/leaderboard?mode=walls&limit=3")
    assert r.status_code == 200
    assert len(r.json()) == 3


def test_leaderboard_missing_mode(client: TestClient) -> None:
    r = client.get("/api/leaderboard")
    assert r.status_code == 422


def test_leaderboard_invalid_mode(client: TestClient) -> None:
    r = client.get("/api/leaderboard?mode=invalid")
    assert r.status_code == 422
