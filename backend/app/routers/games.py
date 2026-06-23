from __future__ import annotations

from fastapi import APIRouter, Depends, status

from ..auth import get_current_user
from ..models import ActiveGame, ErrorResponse, GameState, User
from .. import store

router = APIRouter(prefix="/games", tags=["game", "spectator"])


@router.get(
    "/active",
    response_model=list[ActiveGame],
    tags=["spectator"],
)
def list_active_games() -> list[ActiveGame]:
    return store.list_active_games()


@router.put(
    "/active",
    response_model=ActiveGame,
    responses={401: {"model": ErrorResponse}},
    tags=["game"],
)
def publish_game(
    body: GameState,
    current_user: User = Depends(get_current_user),
) -> ActiveGame:
    return store.upsert_active_game(current_user, body)


@router.delete(
    "/active",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": ErrorResponse}},
    tags=["game"],
)
def end_game(current_user: User = Depends(get_current_user)) -> None:
    store.remove_active_game(current_user.id)
