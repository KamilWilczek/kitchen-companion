from uuid import UUID

from app.actions import create_or_merge_item, normalize_key
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.recipe import Recipe
from app.models.shopping_item import ShoppingItem
from app.models.user import User
from app.schemas.shopping_item import (
    ShoppingItemIn,
    ShoppingItemOut,
    ShoppingItemUpdate,
)
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=list[ShoppingItemOut])
def get_shopping_list(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[ShoppingItemOut]:
    items = db.scalars(
        select(ShoppingItem).where(ShoppingItem.user_id == current_user.id)
    ).all()

    return items


@router.post("/", response_model=ShoppingItemOut)
def add_item(
    item: ShoppingItemIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShoppingItemOut:
    return create_or_merge_item(db=db, user=current_user, data=item)


@router.patch("/{item_id}", response_model=ShoppingItemOut)
def update_item(
    item_id: UUID,
    patch: ShoppingItemUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShoppingItemOut:
    item = db.get(ShoppingItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Item not found")

    data = patch.model_dump(exclude_unset=True)

    target_name = item.name
    target_unit = item.unit

    if "name" in data and data["name"] is not None:
        target_name = data["name"].strip()

    if "unit" in data and data["unit"] is not None:
        target_unit = data["unit"].strip()

    if target_name != item.name or target_unit != item.unit:
        target_name_norm, target_unit_norm = normalize_key(target_name, target_unit)

        dup = db.scalar(
            select(ShoppingItem).where(
                ShoppingItem.user_id == current_user.id,
                ShoppingItem.id != item.id,
                ShoppingItem.name_norm == target_name_norm,
                ShoppingItem.unit_norm == target_unit_norm,
            )
        )

        if dup:
            item.quantity += dup.quantity
            item.checked = False
            db.delete(dup)
            db.commit()

        item.name = target_name
        item.unit = target_unit
        item.name_norm = target_name_norm
        item.unit_norm = target_unit_norm

    if "quantity" in data and data["quantity"] is not None:
        item.quantity = data["quantity"]

    if "checked" in data and data["checked"] is not None:
        item.checked = data["checked"]

    if "recipe_id" in data:
        item.recipe_id = data["recipe_id"] if data["recipe_id"] else None

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    item = db.get(ShoppingItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()
    return None


@router.delete("/", status_code=204)
def clear_list(
    clear_checked: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    q = select(ShoppingItem).where(ShoppingItem.user_id == current_user.id)
    if clear_checked:
        q = q.where(ShoppingItem.checked)

        for row in db.scalars(q).all():
            db.delete(row)
    else:
        for row in db.scalars(q).all():
            db.delete(row)

    db.commit()
    return None


@router.post("/from-recipe/{recipe_id}", response_model=list[ShoppingItemOut])
def add_from_recipe(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ShoppingItemOut]:
    recipe = db.get(Recipe, recipe_id)
    if not recipe or recipe.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Recipe not found")

    added: list[ShoppingItemOut] = []
    for ing in recipe.ingredients:
        added_item = create_or_merge_item(
            db=db,
            user=current_user,
            data=ShoppingItemIn(
                name=ing.name,
                quantity=ing.quantity,
                unit=ing.unit,
                recipe_id=recipe_id,
            ),
        )
        added.append(added_item)
    return added
