import logging
from uuid import UUID

from app.core.config import settings

logger = logging.getLogger(__name__)
from app.core.db import get_db
from app.core.security import decode_token
from app.models.user import User
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError
from sqlalchemy.orm import Session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def _get_user_by_id(db: Session, user_id: UUID) -> User | None:
    return db.get(User, user_id)


def _get_or_create_user_by_external_id(db: Session, external_id: str) -> User:
    pass


def get_current_user(
    db: Session = Depends(get_db),
    token: str = Depends(oauth2_scheme),
    x_user_id: str | None = Header(default=None, alias=settings.USER_ID_HEADER),
) -> User:
    """
    - If AUTH_BACKEND=jwt → use JWT from Authorization header.
    - If AUTH_BACKEND=header → use X-User-Id header and auto-provision if configured.
    """
    if settings.AUTH_BACKEND == "jwt":
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = decode_token(token, expected_type="access")
            sub: str | None = payload.get("sub")
            if sub is None:
                raise credentials_exception
            user_id = UUID(sub)
        except (JWTError, ValueError):
            logger.warning("Invalid or expired access token")
            raise credentials_exception

        user = _get_user_by_id(db, user_id)
        if user is None:
            logger.warning("Access token for unknown user=%s", user_id)
            raise credentials_exception
        return user

    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Missing {settings.USER_ID_HEADER} header",
        )

    return _get_or_create_user_by_external_id(db, x_user_id)


def require_premium(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.plan != "premium":
        logger.warning("Premium access denied user=%s plan=%s", current_user.id, current_user.plan)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium plan required",
        )
    return current_user
