from pydantic import BaseModel
from typing import List, Optional

from app.schemas.tag import TagOut


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
    id: str
    tags: List[TagOut]

    class Config:
        from_attributes = True