import logging
import random
import string
from datetime import datetime, timedelta, timezone
from uuid import UUID

import resend
from app.core.config import settings

logger = logging.getLogger(__name__)
from app.core.db import get_db
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.password_reset import PasswordResetCode
from app.models.user import User
from app.schemas.auth import (
    ConfirmResetRequest,
    LoginRequest,
    RefreshRequest,
    RequestResetRequest,
    Token,
    UserCreate,
    UserOut,
)
from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlalchemy import select, update
from sqlalchemy.orm import Session

limiter = Limiter(
    key_func=get_remote_address,
    enabled=settings.RATE_LIMIT_ENABLED,
)

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def register(
    request: Request,
    data: UserCreate,
    db: Session = Depends(get_db),
):
    existing = db.scalar(select(User).where(User.email == data.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    credentials: LoginRequest,
    db: Session = Depends(get_db),
):
    user = db.scalar(select(User).where(User.email == credentials.email))
    if not user or not verify_password(credentials.password, user.password_hash):
        logger.warning("Failed login attempt for email=%s ip=%s", credentials.email, request.client.host if request.client else "unknown")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    logger.info("Successful login user=%s", user.id)
    token_data = {"sub": str(user.id), "plan": user.plan}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
@limiter.limit("10/minute")
def refresh(
    request: Request,
    body: RefreshRequest,
    db: Session = Depends(get_db),
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        payload = decode_token(body.refresh_token, expected_type="refresh")
        sub: str | None = payload.get("sub")
        if sub is None:
            raise credentials_exception
    except Exception:
        logger.warning("Invalid refresh token ip=%s", request.client.host if request.client else "unknown")
        raise credentials_exception

    user = db.get(User, UUID(sub))
    if user is None:
        logger.warning("Refresh token for deleted user=%s ip=%s", sub, request.client.host if request.client else "unknown")
        raise credentials_exception

    logger.info("Token refreshed user=%s", user.id)
    token_data = {"sub": str(user.id), "plan": user.plan}
    access_token = create_access_token(data=token_data)
    refresh_token = create_refresh_token(data={"sub": str(user.id)})

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/request-reset", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
def request_reset(
    request: Request,
    data: RequestResetRequest,
    db: Session = Depends(get_db),
):
    # Invalidate any existing unused codes for this email
    db.execute(
        update(PasswordResetCode)
        .where(PasswordResetCode.email == data.email, PasswordResetCode.used == False)
        .values(used=True)
    )

    code = "".join(random.choices(string.digits, k=6))
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    db.add(PasswordResetCode(email=data.email, code=code, expires_at=expires_at))
    db.commit()

    if settings.RESEND_API_KEY:
        resend.api_key = settings.RESEND_API_KEY
        resend.Emails.send({
            "from": settings.RESET_CODE_FROM_EMAIL,
            "to": data.email,
            "subject": "Kitchen Companion — password reset code",
            "html": (
                f"<p>Your password reset code is: <strong style='font-size:24px;letter-spacing:4px'>{code}</strong></p>"
                f"<p>This code expires in 15 minutes. If you didn't request this, ignore this email.</p>"
            ),
        })
    else:
        # Dev fallback — log the code so it can be used without email setup
        logger.warning("RESEND_API_KEY not set. Password reset code for %s: %s", data.email, code)

    # Always return 200 — never reveal whether the email exists
    return {"detail": "If this email is registered, a reset code has been sent."}


@router.post("/confirm-reset", status_code=status.HTTP_200_OK)
@limiter.limit("5/minute")
def confirm_reset(
    request: Request,
    data: ConfirmResetRequest,
    db: Session = Depends(get_db),
):
    now = datetime.now(timezone.utc)
    reset_code = db.scalar(
        select(PasswordResetCode).where(
            PasswordResetCode.email == data.email,
            PasswordResetCode.code == data.code,
            PasswordResetCode.used == False,
            PasswordResetCode.expires_at > now,
        )
    )
    if not reset_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired code.",
        )

    user = db.scalar(select(User).where(User.email == data.email))
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired code.")

    user.password_hash = hash_password(data.new_password)
    reset_code.used = True
    db.commit()

    logger.info("Password reset for user=%s", user.id)
    return {"detail": "Password updated successfully."}
