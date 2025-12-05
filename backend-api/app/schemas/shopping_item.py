from enum import Enum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class Unit(str, Enum):
    L = "l"
    KG = "kg"
    ML = "ml"
    G = "g"
    SZT = "szt."
    OP = "op."


VALID_UNITS: tuple[str, ...] = tuple(unit.value for unit in Unit)


class ShoppingItemIn(BaseModel):
    name: str
    quantity: float
    unit: Unit | None = None
    recipe_id: UUID | None = None


class ShoppingItemOut(ShoppingItemIn):
    id: UUID
    checked: bool = False

    model_config = ConfigDict(from_attributes=True)


class ShoppingItemUpdate(BaseModel):
    name: str | None = None
    unit: Unit | None = None
    quantity: float | None = None
    checked: bool | None = None
    recipe_id: UUID | None = None


class ShoppingListBase(BaseModel):
    name: str | None = None
    description: str | None = None

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, v: str) -> str:
        if v.strip() == "":
            raise ValueError("Name cannot be empty")
        return v


class ShoppingListIn(ShoppingListBase):
    model_config = ConfigDict(extra="forbid")


class ShoppingListOut(ShoppingListBase):
    id: UUID
    total_items: int
    checked_items: int

    model_config = ConfigDict(from_attributes=True)


class ShoppingListUpdate(ShoppingListBase):
    name: str | None = None
    description: str | None = None

    model_config = ConfigDict(extra="forbid")

    @field_validator("name")
    @classmethod
    def name_cannot_be_blank(cls, v: str | None) -> str | None:
        if v is not None and v.strip() == "":
            raise ValueError("Name cannot be empty")
        return v
