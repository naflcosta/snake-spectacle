
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import ActiveGame, ErrorResponse, GameState, User
from .. import store

router = APIRouter(prefix="/games", tags=["game", "spectator"])


@router.get(
    "/active",
    response_model=list[ActiveGame],
    tags=["spectator"],
)
def list_active_games(db: Session = Depends(get_db)) -> list[ActiveGame]:
    return store.list_active_games(db)


@router.put(
    "/active",
    response_model=ActiveGame,
    responses={401: {"model": ErrorResponse}},
    tags=["game"],
)
def publish_game(
    body: GameState,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ActiveGame:
    return store.upsert_active_game(db, current_user, body)


@router.delete(
    "/active",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": ErrorResponse}},
    tags=["game"],
)
def end_game(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    store.remove_active_game(db, current_user.id)
