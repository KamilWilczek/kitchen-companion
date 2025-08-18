from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from uuid import uuid4
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# In-memory store for now
recipes = []


class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str

class RecipeIn(BaseModel):
    title: str
    description: str
    ingredients: List[Ingredient]

class RecipeOut(RecipeIn):
    id: str

def find_index(recipe_id: str) -> int:
    for i, r in enumerate(recipes):
        if r["id"] == recipe_id:
            return i
    return -1

@app.get("/")
def root():
    print("Root ping")
    return {"ok": True}

@app.get("/recipes", response_model=List[RecipeOut])
def get_recipes():
    return recipes

@app.post("/recipes", response_model=RecipeOut)
def add_recipe(recipe: RecipeIn):
    new_recipe = recipe.model_dump()
    new_recipe["id"] = str(uuid4())
    recipes.append(new_recipe)
    return new_recipe

@app.put("/recipes/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: str, payload: RecipeIn):
    idx = find_index(recipe_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Recipe not found")
    updated = {**payload.model_dump(), "id": recipe_id}
    recipes[idx] = updated
    return updated

@app.delete("/recipes/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: str):
    idx = find_index(recipe_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Recipe not found")
    recipes.pop(idx)
    return