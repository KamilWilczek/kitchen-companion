from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class Unit(str, Enum):
    L = "l"
    KG = "kg"
    ML = "ml"
    G = "g"
    SZT = "szt."
    OP = "op."


VALID_UNITS: tuple[str, ...] = tuple(unit.value for unit in Unit)


class ShoppingItemIn(BaseModel):
    name: str = Field(max_length=255)
    quantity: float = Field(ge=0, le=999999)
    unit: Unit | None = None
    recipe_id: UUID | None = None
    category_id: UUID | None = None


class ShoppingItemOut(ShoppingItemIn):
    id: UUID
    checked: bool = False
    recipe_title: str | None = None
    category: "CategoryOut | None" = None

    model_config = ConfigDict(from_attributes=True)


class ShoppingItemUpdate(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    unit: Unit | None = None
    quantity: float | None = Field(default=None, ge=0, le=999999)
    checked: bool | None = None
    recipe_id: UUID | None = None
    category_id: UUID | None = None


class ShoppingListBase(BaseModel):
    name: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=2000)

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, v: str) -> str:
        if v.strip() == "":
            raise ValueError("Name cannot be empty")
        return v


class ShoppingListIn(ShoppingListBase):
    model_config = ConfigDict(extra="forbid")


class ShoppingListShareIn(BaseModel):
    shared_with_email: EmailStr


class SharedUserOut(BaseModel):
    id: UUID
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)


class ShoppingListOut(ShoppingListBase):
    id: UUID
    total_items: int
    checked_items: int
    shared_with_users: list[SharedUserOut] = []

    model_config = ConfigDict(from_attributes=True)


class ShoppingListUpdate(ShoppingListBase):
    name: str | None = None
    description: str | None = None

    model_config = ConfigDict(extra="forbid")

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, v: str) -> str:
        if v.strip() == "":
            raise ValueError("Name cannot be empty")
        return v


from app.schemas.category import CategoryOut  # noqa: E402 — resolves forward ref

ShoppingItemOut.model_rebuild()
