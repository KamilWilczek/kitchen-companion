from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)


class UpdatePlanRequest(BaseModel):
    plan: Literal["free", "premium"]


class AccountOut(BaseModel):
    id: UUID
    email: EmailStr
    plan: str

    model_config = ConfigDict(from_attributes=True)
