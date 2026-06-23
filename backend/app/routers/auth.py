
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
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
def signup(body: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    if store.get_user_by_username(db, body.username):
        raise HTTPException(status_code=409, detail="Username already taken")
    user = store.create_user(db, body.username, body.password)
    token = store.create_token(db, user.id)
    return AuthResponse(token=token, user=user)


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={401: {"model": ErrorResponse}},
)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = store.verify_password(db, body.username, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = store.create_token(db, user.id)
    return AuthResponse(token=token, user=user)


@router.post(
    "/logout",
    status_code=status.HTTP_204_NO_CONTENT,
    responses={401: {"model": ErrorResponse}},
)
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> None:
    store.revoke_token(db, credentials.credentials)
    store.remove_active_game(db, current_user.id)


@router.get(
    "/me",
    response_model=User,
    responses={401: {"model": ErrorResponse}},
)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user
