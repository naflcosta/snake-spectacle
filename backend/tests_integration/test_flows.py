"""Integration tests — full end-to-end flows against a real SQLite file."""

from fastapi.testclient import TestClient


# ── Helpers ──────────────────────────────────────────────────────────────────

def _signup(client: TestClient, username: str, password: str) -> dict:
    r = client.post("/api/auth/signup", json={"username": username, "password": password})
    assert r.status_code == 201, r.text
    return r.json()


def _login(client: TestClient, username: str, password: str) -> dict:
    r = client.post("/api/auth/login", json={"username": username, "password": password})
    assert r.status_code == 200, r.text
    return r.json()


def _auth_headers(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


# ── Sign-up flow ──────────────────────────────────────────────────────────────

def test_signup_returns_token_and_user(client: TestClient) -> None:
    body = _signup(client, "alice", "hunter2")
    assert body["user"]["username"] == "alice"
    assert len(body["token"]) > 0


def test_signup_persists_across_requests(client: TestClient) -> None:
    signup_body = _signup(client, "alice", "hunter2")
    token = signup_body["token"]

    r = client.get("/api/auth/me", headers=_auth_headers(token))
    assert r.status_code == 200
    assert r.json()["username"] == "alice"


def test_duplicate_signup_is_rejected(client: TestClient) -> None:
    _signup(client, "alice", "hunter2")
    r = client.post("/api/auth/signup", json={"username": "alice", "password": "other"})
    assert r.status_code == 409


# ── Log-in flow ───────────────────────────────────────────────────────────────

def test_login_after_signup(client: TestClient) -> None:
    _signup(client, "alice", "hunter2")
    body = _login(client, "alice", "hunter2")
    assert body["user"]["username"] == "alice"
    assert len(body["token"]) > 0


def test_login_issues_working_token(client: TestClient) -> None:
    _signup(client, "alice", "hunter2")
    token = _login(client, "alice", "hunter2")["token"]

    r = client.get("/api/auth/me", headers=_auth_headers(token))
    assert r.status_code == 200


def test_login_wrong_password_rejected(client: TestClient) -> None:
    _signup(client, "alice", "hunter2")
    r = client.post("/api/auth/login", json={"username": "alice", "password": "wrong"})
    assert r.status_code == 401


# ── Score submission flow ──────────────────────────────────────────────────────

def test_submit_score_returns_entry(client: TestClient) -> None:
    token = _signup(client, "alice", "hunter2")["token"]
    r = client.post(
        "/api/scores",
        json={"mode": "walls", "score": 42},
        headers=_auth_headers(token),
    )
    assert r.status_code == 201
    body = r.json()
    assert body["score"] == 42
    assert body["mode"] == "walls"
    assert body["username"] == "alice"
    assert "id" in body
    assert body["createdAt"] > 0


def test_submit_score_requires_auth(client: TestClient) -> None:
    r = client.post("/api/scores", json={"mode": "walls", "score": 42})
    assert r.status_code == 401


# ── Leaderboard read-back flow ────────────────────────────────────────────────

def test_submitted_score_appears_on_leaderboard(client: TestClient) -> None:
    token = _signup(client, "alice", "hunter2")["token"]
    client.post("/api/scores", json={"mode": "walls", "score": 42}, headers=_auth_headers(token))

    r = client.get("/api/leaderboard?mode=walls")
    assert r.status_code == 200
    entries = r.json()
    assert len(entries) == 1
    assert entries[0]["score"] == 42
    assert entries[0]["username"] == "alice"


def test_leaderboard_sorted_highest_first(client: TestClient) -> None:
    token = _signup(client, "alice", "hunter2")["token"]
    for score in [10, 99, 55]:
        client.post("/api/scores", json={"mode": "walls", "score": score}, headers=_auth_headers(token))

    entries = client.get("/api/leaderboard?mode=walls").json()
    scores = [e["score"] for e in entries]
    assert scores == sorted(scores, reverse=True)


def test_leaderboard_filters_by_mode(client: TestClient) -> None:
    token = _signup(client, "alice", "hunter2")["token"]
    client.post("/api/scores", json={"mode": "walls", "score": 10}, headers=_auth_headers(token))
    client.post("/api/scores", json={"mode": "wrap", "score": 99}, headers=_auth_headers(token))

    walls = client.get("/api/leaderboard?mode=walls").json()
    wrap = client.get("/api/leaderboard?mode=wrap").json()

    assert all(e["mode"] == "walls" for e in walls)
    assert all(e["mode"] == "wrap" for e in wrap)
    assert len(walls) == 1
    assert len(wrap) == 1


def test_leaderboard_scores_from_multiple_users(client: TestClient) -> None:
    alice_token = _signup(client, "alice", "hunter2")["token"]
    bob_token = _signup(client, "bob", "pass123")["token"]

    client.post("/api/scores", json={"mode": "walls", "score": 30}, headers=_auth_headers(alice_token))
    client.post("/api/scores", json={"mode": "walls", "score": 80}, headers=_auth_headers(bob_token))

    entries = client.get("/api/leaderboard?mode=walls").json()
    assert len(entries) == 2
    assert entries[0]["score"] == 80
    assert entries[0]["username"] == "bob"
    assert entries[1]["score"] == 30
    assert entries[1]["username"] == "alice"


# ── Full signup → login → submit → leaderboard flow ──────────────────────────

def test_full_flow(client: TestClient) -> None:
    # Sign up
    signup_body = _signup(client, "alice", "hunter2")
    user_id = signup_body["user"]["id"]

    # Log in with a fresh token
    login_token = _login(client, "alice", "hunter2")["token"]
    headers = _auth_headers(login_token)

    # Submit two scores in different modes
    client.post("/api/scores", json={"mode": "walls", "score": 75}, headers=headers)
    client.post("/api/scores", json={"mode": "wrap", "score": 120}, headers=headers)

    # Read back walls leaderboard
    walls = client.get("/api/leaderboard?mode=walls").json()
    assert len(walls) == 1
    assert walls[0]["score"] == 75
    assert walls[0]["userId"] == user_id

    # Read back wrap leaderboard
    wrap = client.get("/api/leaderboard?mode=wrap").json()
    assert len(wrap) == 1
    assert wrap[0]["score"] == 120

    # Logout revokes the token
    r = client.post("/api/auth/logout", headers=headers)
    assert r.status_code == 204

    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 401
