from typing import Annotated

from app.core.config import settings
from app.core.db import get_db
from app.models.user import User
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session


def _get_by_external_id(db: Session, external_id: str) -> User | None:
    return db.scalar(select(User).where(User.external_id == external_id))


def _provision_user(db: Session, external_id: str) -> User:
    user = User(external_id=external_id, email=f"{external_id}@example.com")
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


async def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    x_user_id: Annotated[str | None, Header(alias="X-User-Id")] = None,
) -> User:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing X-User-Id"
        )
    user = _get_by_external_id(db, x_user_id)
    if not user:
        if settings.AUTO_PROVISION_USERS:
            user = _provision_user(db, x_user_id)
        else:
            raise HTTPException(status_code=404, detail="User not found")
    return user
