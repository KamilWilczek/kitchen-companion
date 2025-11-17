from typing import List, Optional
from uuid import UUID

from app.schemas.tag import TagOut
from pydantic import BaseModel, ConfigDict


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str

    model_config = ConfigDict(from_attributes=True)


class RecipeBase(BaseModel):
    title: str
    description: str
    ingredients: List[Ingredient]
    source: Optional[str] = None


class RecipeIn(RecipeBase):
    tag_ids: List[UUID] = []

    model_config = ConfigDict(extra="forbid")  # reject unknown "tags"


class RecipeOut(RecipeBase):
    id: UUID
    tags: List[TagOut]

    model_config = ConfigDict(from_attributes=True)
