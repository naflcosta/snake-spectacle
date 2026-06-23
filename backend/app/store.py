"""In-memory store for users, scores, and active games."""
from __future__ import annotations

import time
import uuid
from typing import Optional

import bcrypt

from .models import ActiveGame, Direction, GameMode, GameState, Point, ScoreEntry, User

# ── Storage ─────────────────────────────────────────────────────────────────

# {user_id: {"user": User, "hashed_password": str}}
_users: dict[str, dict] = {}
# {username: user_id}  — fast lookup
_usernames: dict[str, str] = {}
# {token: user_id}
_tokens: dict[str, str] = {}
# [ScoreEntry, ...]
_scores: list[ScoreEntry] = []
# {user_id: ActiveGame}
_active_games: dict[str, ActiveGame] = {}


# ── Helpers ─────────────────────────────────────────────────────────────────

def _now_ms() -> int:
    return int(time.time() * 1000)


def _new_id() -> str:
    return uuid.uuid4().hex


# ── Users ────────────────────────────────────────────────────────────────────

def get_user_by_id(user_id: str) -> Optional[User]:
    entry = _users.get(user_id)
    return entry["user"] if entry else None


def get_user_by_username(username: str) -> Optional[User]:
    user_id = _usernames.get(username)
    return get_user_by_id(user_id) if user_id else None


def create_user(username: str, password: str) -> User:
    user = User(id=_new_id(), username=username)
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    _users[user.id] = {"user": user, "hashed_password": hashed}
    _usernames[username] = user.id
    return user


def verify_password(username: str, password: str) -> Optional[User]:
    user_id = _usernames.get(username)
    if not user_id:
        return None
    entry = _users[user_id]
    if not bcrypt.checkpw(password.encode(), entry["hashed_password"]):
        return None
    return entry["user"]


# ── Tokens ───────────────────────────────────────────────────────────────────

def create_token(user_id: str) -> str:
    token = _new_id()
    _tokens[token] = user_id
    return token


def get_user_by_token(token: str) -> Optional[User]:
    user_id = _tokens.get(token)
    return get_user_by_id(user_id) if user_id else None


def revoke_token(token: str) -> None:
    _tokens.pop(token, None)


# ── Scores ───────────────────────────────────────────────────────────────────

def add_score(user: User, mode: GameMode, score: int) -> ScoreEntry:
    entry = ScoreEntry(
        id=_new_id(),
        userId=user.id,
        username=user.username,
        mode=mode,
        score=score,
        createdAt=_now_ms(),
    )
    _scores.append(entry)
    return entry


def get_leaderboard(mode: GameMode, limit: int = 10) -> list[ScoreEntry]:
    filtered = [s for s in _scores if s.mode == mode]
    filtered.sort(key=lambda s: (-s.score, s.createdAt))
    return filtered[:limit]


# ── Active games ─────────────────────────────────────────────────────────────

def upsert_active_game(user: User, state: GameState) -> ActiveGame:
    game = ActiveGame(
        userId=user.id,
        username=user.username,
        mode=state.mode,
        state=state,
        updatedAt=_now_ms(),
    )
    _active_games[user.id] = game
    return game


def remove_active_game(user_id: str) -> None:
    _active_games.pop(user_id, None)


def list_active_games() -> list[ActiveGame]:
    return list(_active_games.values())


def get_active_game(user_id: str) -> Optional[ActiveGame]:
    return _active_games.get(user_id)


# ── Seed data ─────────────────────────────────────────────────────────────────

def _seed() -> None:
    alice = create_user("alice", "pass123")
    bob = create_user("bob", "pass123")
    carol = create_user("carol", "pass123")

    for user, mode, score in [
        (alice, GameMode.walls, 42),
        (alice, GameMode.wrap, 87),
        (bob, GameMode.walls, 65),
        (bob, GameMode.walls, 31),
        (carol, GameMode.wrap, 110),
        (carol, GameMode.walls, 55),
    ]:
        add_score(user, mode, score)

    upsert_active_game(
        bob,
        GameState(
            snake=[Point(x=5, y=5), Point(x=4, y=5), Point(x=3, y=5)],
            food=Point(x=10, y=8),
            direction=Direction.right,
            mode=GameMode.walls,
            score=12,
            alive=True,
            tick=47,
        ),
    )
    upsert_active_game(
        carol,
        GameState(
            snake=[Point(x=12, y=12), Point(x=12, y=13)],
            food=Point(x=2, y=2),
            direction=Direction.up,
            mode=GameMode.wrap,
            score=30,
            alive=True,
            tick=110,
        ),
    )


_seed()
