from app.core.db import get_db
from app.core.deps import get_current_user, require_premium
from app.core.security import create_access_token, create_refresh_token, hash_password, verify_password
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

    token_data = {"sub": str(current_user.id), "plan": current_user.plan}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"sub": str(current_user.id)})

    return Token(access_token=access_token, refresh_token=refresh_token)


# --- Example: premium-only endpoint ---
# Use `require_premium` instead of `get_current_user` to guard any endpoint.
# Free users get 403 Forbidden automatically.
@router.get("/premium-check")
def premium_check(current_user: User = Depends(require_premium)):
    return {"message": f"Welcome, premium user {current_user.email}!"}
