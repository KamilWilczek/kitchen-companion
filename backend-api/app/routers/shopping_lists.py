from uuid import UUID

from app.actions import (
    _find_and_merge_existing,
    create_or_merge_item,
    list_participants,
    recipe_participants,
    user_can_edit_list,
    user_can_edit_recipe,
)
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.recipe import Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.user import User
from app.schemas.shopping_item import (
    ShoppingItemIn,
    ShoppingItemOut,
    ShoppingItemUpdate,
    ShoppingListIn,
    ShoppingListOut,
    ShoppingListUpdate,
)
from fastapi import APIRouter, Body, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

router = APIRouter()


@router.post("/", response_model=ShoppingListOut)
def create_shopping_list(
    payload: ShoppingListIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShoppingListOut:
    new_list = ShoppingList(
        user_id=current_user.id,
        name=payload.name.strip(),
        description=payload.description,
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)
    return new_list


@router.get("/", response_model=list[ShoppingListOut])
def get_all_shopping_lists(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ShoppingListOut]:
    q = (
        select(ShoppingList)
        .outerjoin(
            ShoppingList.shared_with_users,
        )
        .where(
            or_(
                ShoppingList.user_id == current_user.id,
                User.id == current_user.id,
            )
        )
        .distinct()
    )
    return db.scalars(q).all()


@router.get("/{list_id}", response_model=ShoppingListOut)
def get_shopping_list(
    list_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShoppingListOut:
    shopping_list = db.get(ShoppingList, list_id)
    if not shopping_list or not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")

    return shopping_list


@router.patch("/{list_id}", response_model=ShoppingListOut)
def update_shopping_list(
    list_id: UUID,
    payload: ShoppingListUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShoppingListOut:
    shopping_list = db.get(ShoppingList, list_id)
    if not shopping_list or not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")

    data = payload.model_dump(exclude_unset=True)

    if "name" in data and data["name"] is not None:
        shopping_list.name = data["name"].strip()

    if "description" in data:
        shopping_list.description = data["description"]

    db.commit()
    db.refresh(shopping_list)
    return shopping_list


@router.delete("/{list_id}", status_code=204)
def delete_shopping_list(
    list_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    shopping_list = db.scalar(
        select(ShoppingList).where(
            ShoppingList.id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")

    db.delete(shopping_list)
    db.commit()
    return None


@router.post("/{list_id}/share", status_code=204)
def share_shopping_list(
    list_id: UUID,
    payload: ShoppingListIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    shopping_list = db.scalar(
        select(ShoppingList).where(
            ShoppingList.id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")

    if payload.shared_with_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share list with yourself")

    shared_user = db.scalar(select(User).where(User.id == payload.shared_with_id))
    if not shared_user:
        raise HTTPException(status_code=404, detail="User to share with not found")

    if any(u.id == shared_user.id for u in shopping_list.shared_with_users):
        return None

    shopping_list.shared_with_users.append(shared_user)

    db.commit()
    return None


@router.delete("/{list_id}/share/{user_id}", status_code=204)
def unshare_shopping_list(
    list_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    shopping_list = db.scalar(
        select(ShoppingList).where(
            ShoppingList.id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    if not shopping_list:
        raise HTTPException(status_code=404, detail="List not found")

    shared_user = db.scalar(select(User).where(User.id == user_id))
    if not shared_user:
        raise HTTPException(status_code=404, detail="User to unshare not found")

    shopping_list.shared_with_users = [
        u for u in shopping_list.shared_with_users if u.id != shared_user.id
    ]

    db.commit()
    return None


# ---------------------------------- Items ----------------------------------


@router.post("/{list_id}/items", response_model=ShoppingItemOut)
def add_item(
    list_id: UUID,
    item: ShoppingItemIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShoppingItemOut:
    shopping_list = db.get(ShoppingList, list_id)
    if not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")
    return create_or_merge_item(db=db, shopping_list=shopping_list, data=item)


@router.get("/{list_id}/items", response_model=list[ShoppingItemOut])
def get_shopping_list_items(
    list_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ShoppingItemOut]:
    shopping_list = db.get(ShoppingList, list_id)
    if not shopping_list or not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")

    items = db.scalars(
        select(ShoppingItem).where(ShoppingItem.list_id == list_id)
    ).all()

    return items


@router.patch("/{list_id}/items/{item_id}", response_model=ShoppingItemOut)
def update_item(
    list_id: UUID,
    item_id: UUID,
    patch: ShoppingItemUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ShoppingItemOut:
    shopping_list = db.get(ShoppingList, list_id)
    if not shopping_list or not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")

    item = db.scalar(
        select(ShoppingItem).where(
            ShoppingItem.id == item_id,
            ShoppingItem.list_id == list_id,
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    data = patch.model_dump(exclude_unset=True)

    if "name" in data and (data["name"] is None or data["name"].strip() == ""):
        raise HTTPException(status_code=400, detail="Name cannot be empty")

    target_name = item.name
    target_unit = item.unit

    if "name" in data and data["name"] is not None:
        target_name = data["name"].strip()

    if "unit" in data and data["unit"] is not None:
        target_unit = data["unit"].strip()

    if "quantity" in data and data["quantity"] is not None:
        item.quantity = data["quantity"]

    if "checked" in data and data["checked"] is not None:
        item.checked = data["checked"]

    if "recipe_id" in data:
        item.recipe_id = data["recipe_id"] if data["recipe_id"] else None

    if target_name == item.name and target_unit == item.unit:
        db.commit()
        db.refresh(item)
        return item

    existing, name_norm, unit_norm = _find_and_merge_existing(
        db=db,
        list_id=list_id,
        name=target_name,
        unit=target_unit,
        quantity=item.quantity,
        recipe_id=item.recipe_id,
        exclude_item_id=item.id,
    )

    if existing:
        db.delete(item)
        db.commit()
        db.refresh(existing)
        return existing

    item.name = target_name
    item.unit = target_unit
    item.name_norm = name_norm
    item.unit_norm = unit_norm

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{list_id}/items/{item_id}", status_code=204)
def delete_item(
    list_id: UUID,
    item_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    shopping_list = db.get(ShoppingList, list_id)
    if not shopping_list or not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")

    item = db.scalar(
        select(ShoppingItem).where(
            ShoppingItem.id == item_id,
            ShoppingItem.list_id == list_id,
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()
    return None


@router.delete("/{list_id}/items", status_code=204)
def clear_list(
    list_id: UUID,
    clear_checked: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    shopping_list = db.get(ShoppingList, list_id)
    if not shopping_list or not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")

    q = select(ShoppingItem).where(ShoppingItem.list_id == list_id)
    if clear_checked:
        q = q.where(ShoppingItem.checked)

    for row in db.scalars(q).all():
        db.delete(row)

    db.commit()
    return None


@router.post("/{list_id}/from-recipe/{recipe_id}", response_model=list[ShoppingItemOut])
def add_from_recipe(
    list_id: UUID,
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ShoppingItemOut]:
    shopping_list = db.get(ShoppingList, list_id)
    if not shopping_list or not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")

    recipe = db.get(Recipe, recipe_id)
    if not recipe or not user_can_edit_recipe(current_user, recipe):
        raise HTTPException(status_code=404, detail="Recipe not found")

    list_users = list_participants(shopping_list)
    recipe_users = recipe_participants(recipe)

    leaking_to_others = list_users - recipe_users
    if leaking_to_others:
        raise HTTPException(
            status_code=403,
            detail="Cannot add ingredients from this recipe to a list that includes users without access to the recipe.",
        )

    added: list[ShoppingItemOut] = []
    for ing in recipe.ingredients:
        added_item = create_or_merge_item(
            db=db,
            shopping_list=shopping_list,
            data=ShoppingItemIn(
                name=ing.name,
                quantity=ing.quantity,
                unit=ing.unit,
                recipe_id=recipe_id,
            ),
        )
        added.append(added_item)
    return added
