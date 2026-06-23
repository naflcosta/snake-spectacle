"""Database-backed store for users, tokens, scores, and active games."""

import json
import time
import uuid
from typing import Optional

import bcrypt
from sqlalchemy.orm import Session

from .db_models import ActiveGameRow, ScoreRow, TokenRow, UserRow
from .models import ActiveGame, Direction, GameMode, GameState, Point, ScoreEntry, User


# ── Helpers ─────────────────────────────────────────────────────────────────

def _now_ms() -> int:
    return int(time.time() * 1000)


def _new_id() -> str:
    return uuid.uuid4().hex


def _user_from_row(row: UserRow) -> User:
    return User(id=row.id, username=row.username)


def _score_from_row(row: ScoreRow) -> ScoreEntry:
    return ScoreEntry(
        id=row.id,
        userId=row.user_id,
        username=row.username,
        mode=GameMode(row.mode),
        score=row.score,
        createdAt=row.created_at,
    )


def _active_game_from_row(row: ActiveGameRow) -> ActiveGame:
    return ActiveGame(
        userId=row.user_id,
        username=row.username,
        mode=GameMode(row.mode),
        state=GameState.model_validate_json(row.state_json),
        updatedAt=row.updated_at,
    )


# ── Users ────────────────────────────────────────────────────────────────────

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    row = db.get(UserRow, user_id)
    return _user_from_row(row) if row else None


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    row = db.query(UserRow).filter_by(username=username).first()
    return _user_from_row(row) if row else None


def create_user(db: Session, username: str, password: str) -> User:
    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt())
    row = UserRow(id=_new_id(), username=username, hashed_password=hashed)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _user_from_row(row)


def verify_password(db: Session, username: str, password: str) -> Optional[User]:
    row = db.query(UserRow).filter_by(username=username).first()
    if not row:
        return None
    if not bcrypt.checkpw(password.encode(), row.hashed_password):
        return None
    return _user_from_row(row)


# ── Tokens ───────────────────────────────────────────────────────────────────

def create_token(db: Session, user_id: str) -> str:
    token = _new_id()
    db.add(TokenRow(token=token, user_id=user_id))
    db.commit()
    return token


def get_user_by_token(db: Session, token: str) -> Optional[User]:
    row = db.get(TokenRow, token)
    if not row:
        return None
    return get_user_by_id(db, row.user_id)


def revoke_token(db: Session, token: str) -> None:
    row = db.get(TokenRow, token)
    if row:
        db.delete(row)
        db.commit()


# ── Scores ───────────────────────────────────────────────────────────────────

def add_score(db: Session, user: User, mode: GameMode, score: int) -> ScoreEntry:
    row = ScoreRow(
        id=_new_id(),
        user_id=user.id,
        username=user.username,
        mode=mode.value,
        score=score,
        created_at=_now_ms(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return _score_from_row(row)


def get_leaderboard(db: Session, mode: GameMode, limit: int = 10) -> list[ScoreEntry]:
    rows = (
        db.query(ScoreRow)
        .filter_by(mode=mode.value)
        .order_by(ScoreRow.score.desc(), ScoreRow.created_at.asc())
        .limit(limit)
        .all()
    )
    return [_score_from_row(r) for r in rows]


# ── Active games ─────────────────────────────────────────────────────────────

def upsert_active_game(db: Session, user: User, state: GameState) -> ActiveGame:
    row = db.get(ActiveGameRow, user.id)
    if row:
        row.username = user.username
        row.mode = state.mode.value
        row.state_json = state.model_dump_json()
        row.updated_at = _now_ms()
    else:
        row = ActiveGameRow(
            user_id=user.id,
            username=user.username,
            mode=state.mode.value,
            state_json=state.model_dump_json(),
            updated_at=_now_ms(),
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return _active_game_from_row(row)


def remove_active_game(db: Session, user_id: str) -> None:
    row = db.get(ActiveGameRow, user_id)
    if row:
        db.delete(row)
        db.commit()


def list_active_games(db: Session) -> list[ActiveGame]:
    rows = db.query(ActiveGameRow).all()
    return [_active_game_from_row(r) for r in rows]


def get_active_game(db: Session, user_id: str) -> Optional[ActiveGame]:
    row = db.get(ActiveGameRow, user_id)
    return _active_game_from_row(row) if row else None


# ── Seed data ─────────────────────────────────────────────────────────────────

def seed(db: Session) -> None:
    if db.query(UserRow).count() > 0:
        return

    alice = create_user(db, "alice", "pass123")
    bob = create_user(db, "bob", "pass123")
    carol = create_user(db, "carol", "pass123")

    for user, mode, score in [
        (alice, GameMode.walls, 42),
        (alice, GameMode.wrap, 87),
        (bob, GameMode.walls, 65),
        (bob, GameMode.walls, 31),
        (carol, GameMode.wrap, 110),
        (carol, GameMode.walls, 55),
    ]:
        add_score(db, user, mode, score)

    upsert_active_game(
        db,
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
        db,
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
