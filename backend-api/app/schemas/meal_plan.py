from datetime import date
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict

MealSlot = Literal["breakfast", "lunch", "dinner", "supper"]

VALID_SLOTS: set[str] = {"breakfast", "lunch", "dinner", "supper"}


class RecipeSnippet(BaseModel):
    id: UUID
    title: str

    model_config = ConfigDict(from_attributes=True)


class MealPlanEntryOut(BaseModel):
    id: UUID
    date: date
    meal_slot: str
    recipe: RecipeSnippet

    model_config = ConfigDict(from_attributes=True)


class AssignRecipeRequest(BaseModel):
    recipe_id: UUID
