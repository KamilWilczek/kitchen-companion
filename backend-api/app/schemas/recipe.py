from uuid import UUID

from app.schemas.tag import TagOut
from pydantic import BaseModel, ConfigDict


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str

    model_config = ConfigDict(from_attributes=True)


class IngredientOut(Ingredient):
    id: UUID


class IngredientsToShoppingList(BaseModel):
    ingredient_ids: list[UUID]


class RecipeBase(BaseModel):
    title: str
    description: str
    ingredients: list[Ingredient]
    source: str | None = None


class RecipeIn(RecipeBase):
    ingredients: list[Ingredient]
    tag_ids: list[UUID] = []

    model_config = ConfigDict(extra="forbid")


class RecipeOut(RecipeBase):
    id: UUID
    ingredients: list[IngredientOut]
    tags: list[TagOut]

    model_config = ConfigDict(from_attributes=True)


class RecipeShareIn(BaseModel):
    shared_with_id: UUID

    model_config = ConfigDict(extra="forbid")
