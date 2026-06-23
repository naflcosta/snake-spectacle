from __future__ import annotations

from enum import Enum
from typing import Annotated

from pydantic import BaseModel, Field


class GameMode(str, Enum):
    walls = "walls"
    wrap = "wrap"


class Direction(str, Enum):
    up = "up"
    down = "down"
    left = "left"
    right = "right"


class Point(BaseModel):
    x: Annotated[int, Field(ge=0, le=23)]
    y: Annotated[int, Field(ge=0, le=23)]


class GameState(BaseModel):
    snake: Annotated[list[Point], Field(min_length=1)]
    food: Point
    direction: Direction
    mode: GameMode
    score: Annotated[int, Field(ge=0)]
    alive: bool
    tick: Annotated[int, Field(ge=0)]


class User(BaseModel):
    id: str
    username: str


class AuthResponse(BaseModel):
    token: str
    user: User


class ScoreEntry(BaseModel):
    id: str
    userId: str
    username: str
    mode: GameMode
    score: Annotated[int, Field(ge=0)]
    createdAt: int  # Unix ms


class ActiveGame(BaseModel):
    userId: str
    username: str
    mode: GameMode
    state: GameState
    updatedAt: int  # Unix ms


class ErrorResponse(BaseModel):
    message: str


# ── Request bodies ──────────────────────────────────────────────────────────

class SignupRequest(BaseModel):
    username: Annotated[str, Field(min_length=2)]
    password: Annotated[str, Field(min_length=3)]


class LoginRequest(BaseModel):
    username: str
    password: str


class SubmitScoreRequest(BaseModel):
    mode: GameMode
    score: Annotated[int, Field(ge=0)]
