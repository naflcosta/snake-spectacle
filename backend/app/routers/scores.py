
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
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
    db: Session = Depends(get_db),
) -> ScoreEntry:
    return store.add_score(db, current_user, body.mode, body.score)


@router.get(
    "/leaderboard",
    response_model=list[ScoreEntry],
    responses={400: {"model": ErrorResponse}},
)
def get_leaderboard(
    mode: GameMode = Query(...),
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    db: Session = Depends(get_db),
) -> list[ScoreEntry]:
    return store.get_leaderboard(db, mode, limit)
