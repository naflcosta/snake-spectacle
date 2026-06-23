from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth import get_current_user
from ..models import ErrorResponse, GameMode, ScoreEntry, SubmitScoreRequest, User
from .. import store

router = APIRouter(tags=["scores"])


@router.post(
    "/scores",
    response_model=ScoreEntry,
    status_code=status.HTTP_201_CREATED,
    responses={401: {"model": ErrorResponse}},
)
def submit_score(
    body: SubmitScoreRequest,
    current_user: User = Depends(get_current_user),
) -> ScoreEntry:
    return store.add_score(current_user, body.mode, body.score)


@router.get(
    "/leaderboard",
    response_model=list[ScoreEntry],
    responses={400: {"model": ErrorResponse}},
)
def get_leaderboard(
    mode: GameMode = Query(...),
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
) -> list[ScoreEntry]:
    return store.get_leaderboard(mode, limit)
