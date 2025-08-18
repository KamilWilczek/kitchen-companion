from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
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
recipes: List[dict] = []
tags: List[dict] = []

class TagIn(BaseModel):
    name: str

class TagOut(TagIn):
    id: str

class Ingredient(BaseModel):
    name: str
    quantity: float
    unit: str

class RecipeIn(BaseModel):
    title: str
    description: str
    ingredients: List[Ingredient]
    tag_ids: List[str] = []
    source: Optional[str] = None

class RecipeOut(RecipeIn):
    id: str
    tags: List[TagOut]

def find_index(recipe_id: str) -> int:
    for i, r in enumerate(recipes):
        if r["id"] == recipe_id:
            return i
    return -1

@app.get("/")
def root():
    print("Root ping")
    return {"ok": True}

@app.post("/tags", response_model=TagOut)
def create_tag(tag: TagIn):
    new_tag = {"id": str(uuid4()), **tag.model_dump()}
    tags.append(new_tag)

    return new_tag

@app.get("/tags", response_model=List[TagOut])
def list_tags():
    return tags

@app.put("/tags/{tag_id}", response_model=TagOut)
def rename_tag(tag_id: str, tag: TagIn):
    for t in tags:
        if t["id"] == tag_id:
            t["name"] = tag.name

            return t
        
    raise HTTPException(status_code=404, detail="Tag not found")

@app.delete("/tags/{tag_id}", status_code=200)
def delete_tag(tag_id: str):
    for r in recipes:
        if tag_id in r["tag_ids"]:
            raise HTTPException(status_code=400, detail="Cannot delete tag, it is still assigned to one or more recipes")
    
    for i, t in enumerate(tags):
        if t["id"] == tag_id:
            tags.pop(i)

            return {"detail:" "Tag deleted"}
        
    raise HTTPException(status_code=404, detail="Tag not found")
        

@app.get("/recipes", response_model=List[RecipeOut])
def get_recipes():
    enriched = []
    for r in recipes:
        r_tags = [t for t in tags if t["id"] in r.get("tag_ids", [])]
        enriched.append({**r, "tags": r_tags})
    return enriched


@app.post("/recipes", response_model=RecipeOut)
def add_recipe(recipe: RecipeIn):
    new_recipe = recipe.model_dump()
    new_recipe["id"] = str(uuid4())
    recipes.append(new_recipe)

    r_tags = [t for t in tags if t["id"] in new_recipe.get("tag_ids", [])]
    return {**new_recipe, "tags": r_tags}

@app.put("/recipes/{recipe_id}", response_model=RecipeOut)
def update_recipe(recipe_id: str, payload: RecipeIn):
    idx = next((i for i, r in enumerate(recipes) if r["id"] == recipe_id), -1)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Recipe not found")

    updated = {**payload.model_dump(), "id": recipe_id}
    recipes[idx] = updated

    r_tags = [t for t in tags if t["id"] in updated.get("tag_ids", [])]
    return {**updated, "tags": r_tags}

@app.delete("/recipes/{recipe_id}", status_code=204)
def delete_recipe(recipe_id: str):
    idx = find_index(recipe_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Recipe not found")
    recipes.pop(idx)
    return