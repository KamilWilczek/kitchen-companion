from fastapi import HTTPException, Body, APIRouter
from typing import List, Dict, Any
from uuid import uuid4, UUID

from app.core.db import shopping_list, recipes
from app.schemas.shopping_item import ShoppingItemIn, ShoppingItemOut
from app.routers import find_index

router = APIRouter()

def normalize_key(name: str, unit: str) -> tuple[str, str]:
    return name.strip().lower(), unit.strip().lower()

@router.get("/shopping-list", response_model=List[ShoppingItemOut])
def get_shopping_list():
    return shopping_list

@router.post("/shopping-list", response_model=ShoppingItemOut)
def add_item(item: ShoppingItemIn):
    key_in = normalize_key(item.name, item.unit)

    for existing in shopping_list:
        if normalize_key(existing.name, existing.unit) == key_in:
            existing.quantity += item.quantity

            if not existing.recipe_id and item.recipe_id:
                existing.recipe_id = item.recipe_id

            return existing

    new_item = ShoppingItemOut(
        id=uuid4(),
        name=item.name.strip(),
        unit=item.unit.strip(),
        quantity=item.quantity,
        checked=False,
        recipe_id=item.recipe_id,
    )
    shopping_list.append(new_item)
    return new_item

@router.patch("/shopping-list/{item_id}", response_model=ShoppingItemOut)
def update_item(item_id: UUID, patch: ShoppingItemIn = Body(...)):
    for existing in shopping_list:
        if existing.id == item_id:
            update_data = patch.model_dump(exclude_unset=True)
            for key, value in update_data.items():
                setattr(existing, key, value)

            norm_key = normalize_key(existing.name, existing.unit)

            for other in shopping_list:
                if other.id != existing.id and normalize_key(other.name, other.unit) == norm_key:
                    existing.quantity += other.quantity
                    existing.checked = False
                    shopping_list.remove(other)
                    break

            return existing

    raise HTTPException(status_code=404, detail="Item not found")

@router.delete("/shopping-list/{item_id}", status_code=204)
def delete_item(item_id: str):
    for i, it in enumerate(shopping_list):
        if it["id"] == item_id:
            shopping_list.pop(i)
            return None
    raise HTTPException(status_code=404, detail="Item not found")

@router.delete("/shopping-list", status_code=204)
def clear_list(clear_checked: bool = False):
    if clear_checked:
        shopping_list[:] = [i for i in shopping_list if not i.checked]
    else:
        shopping_list.clear()


@router.post("/shopping-list/from-recipe/{recipe_id}", response_model=List[ShoppingItemOut])
def add_from_recipe(recipe_id: str):
    idx = find_index(recipe_id)
    if idx == -1:
        raise HTTPException(status_code=404, detail="Recipe not found")

    added: List[Dict[str, Any]] = []
    for ing in recipes[idx]["ingredients"]:
        created = add_item(
            ShoppingItemIn(
                name=ing["name"],
                quantity=ing["quantity"],
                unit=ing["unit"],
                recipe_id=recipe_id,
            )
        )
        added.append(created)
    return added