from uuid import UUID

from app.schemas.tag import TagOut
from pydantic import BaseModel, ConfigDict, Field


class Ingredient(BaseModel):
    name: str
    quantity: float = 0
    unit: str = ""

    model_config = ConfigDict(extra="forbid")


class IngredientOut(Ingredient):
    id: UUID

    model_config = ConfigDict(from_attributes=True)


class IngredientPatchIn(Ingredient):
    id: UUID | None = None

    model_config = ConfigDict(extra="forbid")


class IngredientsToShoppingList(BaseModel):
    ingredient_ids: list[UUID] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")


class RecipeBase(BaseModel):
    title: str
    description: str
    source: str | None = None

    model_config = ConfigDict(extra="forbid")


class RecipeIn(RecipeBase):
    ingredients: list[Ingredient] = Field(default_factory=list)
    tag_ids: list[UUID] = Field(default_factory=list)


class RecipePatch(BaseModel):
    # None => don't change
    # []   => clear (for list fields)
    title: str | None = None
    description: str | None = None
    source: str | None = None
    ingredients: list[IngredientPatchIn] | None = None
    tag_ids: list[UUID] | None = None

    model_config = ConfigDict(extra="forbid")


class RecipeOut(RecipeBase):
    id: UUID
    ingredients: list[IngredientOut]
    tags: list[TagOut]

    model_config = ConfigDict(from_attributes=True)


class RecipeShareIn(BaseModel):
    shared_with_email: str

    model_config = ConfigDict(extra="forbid")
