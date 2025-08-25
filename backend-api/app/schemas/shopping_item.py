from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class ShoppingItemIn(BaseModel):
    name: str
    quantity: float
    unit: str
    recipe_id: Optional[UUID] = None


class ShoppingItemOut(ShoppingItemIn):
    id: UUID
    checked: bool = False

    class Config:
        from_attributes = True


class ShoppingItemUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    quantity: Optional[float] = None
    checked: Optional[bool] = None
    recipe_id: Optional[UUID] = None
