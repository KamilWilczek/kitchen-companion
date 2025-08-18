from pydantic import BaseModel
from typing import Optional
from uuid import UUID


class ShoppingItemIn(BaseModel):
    name: str
    quantity: float
    unit: str
    recipe_id: Optional[UUID] = None

class ShoppingItemOut(ShoppingItemIn):
    id: UUID
    checked: bool = False