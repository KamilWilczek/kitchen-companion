from typing import List, Optional
from uuid import UUID

from app.schemas.tag import TagOut
from pydantic import BaseModel


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str

    class Config:
        from_attributes = True


class RecipeIn(BaseModel):
    title: str
    description: str
    ingredients: List[Ingredient]
    tag_ids: List[str] = []
    source: Optional[str] = None


class RecipeOut(RecipeIn):
    id: UUID
    tags: List[TagOut]

    class Config:
        from_attributes = True
