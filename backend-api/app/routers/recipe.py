from fastapi import APIRouter, HTTPException
from typing import List
from uuid import uuid4

from app.core.db import recipes, tags
from app.schemas.recipe import RecipeOut, RecipeIn

router = APIRouter()

recipes: List[RecipeOut] = []


def find_index(recipe_id: str) -> int:
    for i, r in enumerate(recipes):
        if r["id"] == recipe_id:
            return i
    return -1

@router.get("/recipes", response_model=List[RecipeOut])
def get_recipes():
    enriched = []
    for r in recipes:
        r_tags = [t for t in tags if t["id"] in r.get("tag_ids", [])]
        enriched.append({**r, "tags": r_tags})
    return enriched


@router.post("/recipes", response_model=RecipeOut)
def add_recipe(recipe: RecipeIn):
    new_recipe = recipe.model_dump()
    new_recipe["id"] = str(uuid4())
    recipes.append(new_recipe)

    r_tags = [t for t in tags if t["id"] in new_recipe.get("tag_ids", [])]
    return {**new_recipe, "tags": r_tags}

@router.put("/recipes/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: str, payload: RecipeIn):
    idx = next((i for i, r in enumerate(recipes) if r["id"] == recipe_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Recipe not found")

    updated = {**payload.model_dump(), "id": recipe_id}
    recipes[idx] = updated

    r_tags = [t for t in tags if t["id"] in updated.get("tag_ids", [])]
    return {**updated, "tags": r_tags}

@router.delete("/recipes/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: str):
    idx = find_index(recipe_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Recipe not found")
    recipes.pop(idx)
    return