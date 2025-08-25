from fastapi import HTTPException, Body, APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List
from uuid import UUID

from app.core.db import get_db
from app.models.shopping_item import ShoppingItem
from app.models.recipe import Recipe
from app.schemas.shopping_item import (
    ShoppingItemIn,
    ShoppingItemOut,
    ShoppingItemUpdate,
)

router = APIRouter()

# TODO: change to real user later
DEMO_USER_ID = "demo-user"


def normalize_key(name: str, unit: str) -> tuple[str, str]:
    return name.strip().lower(), unit.strip().lower()


@router.get("/", response_model=List[ShoppingItemOut])
def get_shopping_list(db: Session = Depends(get_db)):
    items = db.scalars(
        select(ShoppingItem).where(ShoppingItem.user_id == DEMO_USER_ID)
    ).all()

    return items


@router.post("/", response_model=ShoppingItemOut)
def add_item(item: ShoppingItemIn, db: Session = Depends(get_db)):
    name_norm, unit_norm = normalize_key(item.name, item.unit)

    existing = db.scalar(
        select(ShoppingItem).where(
            ShoppingItem.user_id == DEMO_USER_ID,
            ShoppingItem.name_norm == name_norm,
            ShoppingItem.unit_norm == unit_norm,
        )
    )

    if existing:
        existing.quantity += item.quantity
        if not existing.recipe_id and item.recipe_id:
            existing.recipe_id = str(item.recipe_id)
        db.commit()
        db.refresh(existing)

        return existing

    new_item = ShoppingItem(
        user_id=DEMO_USER_ID,
        name=item.name.strip(),
        unit=item.unit.strip(),
        quantity=item.quantity,
        checked=False,
        recipe_id=str(item.recipe_id) if item.recipe_id else None,
        name_norm=name_norm,
        unit_norm=unit_norm,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    return new_item


@router.patch("/{item_id}", response_model=ShoppingItemOut)
def update_item(
    item_id: UUID, patch: ShoppingItemUpdate = Body(...), db: Session = Depends(get_db)
):
    item = db.get(ShoppingItem, str(item_id))
    if not item or item.user_id != DEMO_USER_ID:
        raise HTTPException(status_code=404, detail="Item not found")

    data = patch.model_dump(exclude_unset=True)

    if "name" in data and data["name"] is not None:
        item.name = data["name"].strip()
        item.name_norm = item.name.lower()

    if "unit" in data and data["unit"] is not None:
        item.unit = data["unit"].strip()
        item.unit_norm = item.unit.lower()

    if "quantity" in data and data["quantity"] is not None:
        item.quantity = data["quantity"]

    if "checked" in data and data["checked"] is not None:
        item.checked = data["checked"]

    if "recipe_id" in data:
        item.recipe_id = str(data["recipe_id"]) if data["recipe_id"] else None

    if ("name" in data and data["name"] is not None) or (
        "unit" in data and data["unit"] is not None
    ):
        dup = db.scalar(
            select(ShoppingItem).where(
                ShoppingItem.user_id == DEMO_USER_ID,
                ShoppingItem.id != item.id,
                ShoppingItem.name_norm == item.name_norm,
                ShoppingItem.unit_norm == item.unit_norm,
            )
        )
        if dup:
            item.quantity += dup.quantity
            item.checked = False
            db.delete(dup)

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: UUID, db: Session = Depends(get_db)):
    item = db.get(ShoppingItem, str(item_id))
    if not item or item.user_id != DEMO_USER_ID:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return None


@router.delete("/", status_code=204)
def clear_list(clear_checked: bool = False, db: Session = Depends(get_db)):
    q = select(ShoppingItem).where(ShoppingItem.user_id == DEMO_USER_ID)
    if clear_checked:
        q = q.where(ShoppingItem.checked)

        for row in db.scalars(q).all():
            db.delete(row)
    else:
        for row in db.scalars(q).all():
            db.delete(row)

    db.commit()
    return None


@router.post("/from-recipe/{recipe_id}", response_model=List[ShoppingItemOut])
def add_from_recipe(recipe_id: str, db: Session = Depends(get_db)):
    recipe = db.get(Recipe, recipe_id)
    if not recipe or recipe.user_id != DEMO_USER_ID:
        raise HTTPException(status_code=404, detail="Recipe not found")

    added: list[ShoppingItemOut] = []
    for ing in recipe.ingredients:
        added_item = add_item(
            ShoppingItemIn(
                name=ing.name, quantity=ing.quantity, unit=ing.unit, recipe_id=recipe_id
            ),
            db=db,
        )
        added.append(added_item)
    return added
