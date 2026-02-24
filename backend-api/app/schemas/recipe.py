from uuid import UUID

from app.schemas.category import CategoryOut
from app.schemas.shopping_item import SharedUserOut
from app.schemas.tag import TagOut
from pydantic import BaseModel, ConfigDict, EmailStr, Field


class Ingredient(BaseModel):
    name: str = Field(max_length=255)
    quantity: float = Field(default=0, ge=0, le=999999)
    unit: str = Field(default="", max_length=50)
    category_id: UUID | None = None

    model_config = ConfigDict(extra="forbid")


class IngredientOut(Ingredient):
    id: UUID
    category: CategoryOut | None = None

    model_config = ConfigDict(from_attributes=True)


class IngredientPatchIn(Ingredient):
    id: UUID | None = None

    model_config = ConfigDict(extra="forbid")


class IngredientsToShoppingList(BaseModel):
    ingredient_ids: list[UUID] = Field(default_factory=list)

    model_config = ConfigDict(extra="forbid")


class RecipeBase(BaseModel):
    title: str = Field(max_length=255)
    description: str = Field(max_length=10000)
    source: str | None = Field(default=None, max_length=1000)

    model_config = ConfigDict(extra="forbid")


class RecipeIn(RecipeBase):
    ingredients: list[Ingredient] = Field(default_factory=list)
    tag_ids: list[UUID] = Field(default_factory=list)


class RecipePatch(BaseModel):
    # None => don't change
    # []   => clear (for list fields)
    title: str | None = Field(default=None, max_length=255)
    description: str | None = Field(default=None, max_length=10000)
    source: str | None = Field(default=None, max_length=1000)
    ingredients: list[IngredientPatchIn] | None = None
    tag_ids: list[UUID] | None = None

    model_config = ConfigDict(extra="forbid")


class RecipeOut(RecipeBase):
    id: UUID
    ingredients: list[IngredientOut]
    tags: list[TagOut]
    shared_with_users: list[SharedUserOut] = []

    model_config = ConfigDict(from_attributes=True)


class RecipeShareIn(BaseModel):
    shared_with_email: EmailStr

    model_config = ConfigDict(extra="forbid")
