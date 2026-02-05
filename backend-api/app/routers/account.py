from datetime import timedelta

from app.core.config import settings
from app.core.db import get_db
from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.account import AccountOut, ChangePasswordRequest, UpdatePlanRequest
from app.schemas.auth import Token
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/me", response_model=AccountOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/password", status_code=204)
def change_password(
    body: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    current_user.password_hash = hash_password(body.new_password)
    db.commit()


@router.put("/plan", response_model=Token)
def update_plan(
    body: UpdatePlanRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    current_user.plan = body.plan
    db.commit()
    db.refresh(current_user)

    access_token = create_access_token(
        data={"sub": str(current_user.id), "plan": current_user.plan},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )

    return Token(access_token=access_token)
