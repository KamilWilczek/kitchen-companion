from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.core.db import get_db
from app.models.recipe import Recipe, Ingredient
from app.models.tag import Tag
from app.schemas.recipe import RecipeOut, RecipeIn

router = APIRouter()

# TODO: change to real user later
DEMO_USER_ID = "demo-user"


@router.get("/", response_model=List[RecipeOut])
def get_recipes(db: Session = Depends(get_db)):

    return db.scalars(select(Recipe)).all()


@router.post("/", response_model=RecipeOut)
def add_recipe(recipe_in: RecipeIn, db: Session = Depends(get_db)):
    recipe = Recipe(
        user_id=DEMO_USER_ID,
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
def update_recipe(recipe_id: str, recipe_in: RecipeIn, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
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
def delete_recipe(recipe_id: str, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return None
