"""Shared fixtures — each test gets a clean in-memory store."""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app import store as _store
from app.main import app


def _reset_store() -> None:
    _store._users.clear()
    _store._usernames.clear()
    _store._tokens.clear()
    _store._scores.clear()
    _store._active_games.clear()


@pytest.fixture()
def client() -> TestClient:
    _reset_store()
    return TestClient(app, raise_server_exceptions=True)


@pytest.fixture()
def auth_client(client: TestClient) -> tuple[TestClient, dict]:
    """Returns (client, headers) for an already-signed-up user."""
    r = client.post("/api/auth/signup", json={"username": "tester", "password": "abc"})
    assert r.status_code == 201
    token = r.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}
    return client, headers
