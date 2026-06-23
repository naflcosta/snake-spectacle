from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..auth import get_current_user
from ..models import AuthResponse, ErrorResponse, LoginRequest, SignupRequest, User
from .. import store

router = APIRouter(prefix="/auth", tags=["auth"])

_bearer = HTTPBearer()


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    responses={409: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
)
def signup(body: SignupRequest) -> AuthResponse:
    if store.get_user_by_username(body.username):
        raise HTTPException(status_code=409, detail="Username already taken")
    user = store.create_user(body.username, body.password)
    token = store.create_token(user.id)
    return AuthResponse(token=token, user=user)


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={401: {"model": ErrorResponse}},
)
def login(body: LoginRequest) -> AuthResponse:
    user = store.verify_password(body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = store.create_token(user.id)
    return AuthResponse(token=token, user=user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": ErrorResponse}},
)
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    current_user: User = Depends(get_current_user),
) -> None:
    store.revoke_token(credentials.credentials)
    store.remove_active_game(current_user.id)


@router.get(
    "/me",
    response_model=User,
    responses={401: {"model": ErrorResponse}},
)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
