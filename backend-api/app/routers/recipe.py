from uuid import UUID

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.recipe import Ingredient, Recipe
from app.models.tag import Tag
from app.models.user import User
from app.schemas.recipe import RecipeIn, RecipeOut
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=list[RecipeOut])
def get_recipes(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[RecipeOut]:
    return db.scalars(select(Recipe).where(Recipe.user_id == current_user.id)).all()


@router.post("/", response_model=RecipeOut)
def add_recipe(
    recipe_in: RecipeIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecipeOut:
    recipe = Recipe(
        user_id=current_user.id,
        title=recipe_in.title,
        description=recipe_in.description,
        source=recipe_in.source,
    )

    recipe.ingredients = [
        Ingredient(name=ing.name, quantity=ing.quantity, unit=ing.unit)
        for ing in recipe_in.ingredients
    ]

    if recipe_in.tag_ids:
        recipe.tags = db.scalars(select(Tag).where(Tag.id.in_(recipe_in.tag_ids))).all()

    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(
    recipe_id: UUID,
    recipe_in: RecipeIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecipeOut:
    recipe = db.scalar(
        select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id)
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe.title = recipe_in.title
    recipe.description = recipe_in.description
    recipe.source = recipe_in.source

    recipe.ingredients.clear()
    recipe.ingredients.extend(
        Ingredient(name=ing.name, quantity=ing.quantity, unit=ing.unit)
        for ing in recipe_in.ingredients
    )

    if recipe_in.tag_ids:
        recipe.tags = db.scalars(select(Tag).where(Tag.id.in_(recipe_in.tag_ids))).all()
    else:
        recipe.tags = []

    db.commit()
    db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    recipe = db.scalar(
        select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id)
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return None
