
from fastapi.testclient import TestClient


def test_signup_creates_user(client: TestClient) -> None:
    r = client.post("/api/auth/signup", json={"username": "alice", "password": "abc"})
    assert r.status_code == 201
    body = r.json()
    assert body["user"]["username"] == "alice"
    assert "token" in body


def test_signup_duplicate_username(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"username": "alice", "password": "abc"})
    r = client.post("/api/auth/signup", json={"username": "alice", "password": "xyz"})
    assert r.status_code == 409


def test_signup_username_too_short(client: TestClient) -> None:
    r = client.post("/api/auth/signup", json={"username": "a", "password": "abc"})
    assert r.status_code == 422


def test_signup_password_too_short(client: TestClient) -> None:
    r = client.post("/api/auth/signup", json={"username": "alice", "password": "ab"})
    assert r.status_code == 422


def test_login_success(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"username": "alice", "password": "abc"})
    r = client.post("/api/auth/login", json={"username": "alice", "password": "abc"})
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_wrong_password(client: TestClient) -> None:
    client.post("/api/auth/signup", json={"username": "alice", "password": "abc"})
    r = client.post("/api/auth/login", json={"username": "alice", "password": "wrong"})
    assert r.status_code == 401


def test_login_unknown_user(client: TestClient) -> None:
    r = client.post("/api/auth/login", json={"username": "nobody", "password": "abc"})
    assert r.status_code == 401


def test_me_authenticated(auth_client: tuple) -> None:
    client, headers = auth_client
    r = client.get("/api/auth/me", headers=headers)
    assert r.status_code == 200
    assert r.json()["username"] == "tester"


def test_me_unauthenticated(client: TestClient) -> None:
    r = client.get("/api/auth/me")
    assert r.status_code == 401


def test_me_bad_token(client: TestClient) -> None:
    r = client.get("/api/auth/me", headers={"Authorization": "Bearer bad"})
    assert r.status_code == 401


def test_logout(auth_client: tuple) -> None:
    client, headers = auth_client
    r = client.post("/api/auth/logout", headers=headers)
    assert r.status_code == 204
    # token is now revoked
    r2 = client.get("/api/auth/me", headers=headers)
    assert r2.status_code == 401
