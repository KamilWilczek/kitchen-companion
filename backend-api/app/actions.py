import typing as t
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recipe import Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.user import User
from app.schemas.shopping_item import ShoppingItemIn


def normalize_key(name: str, unit: str | None) -> tuple[str, str]:
    name_norm = name.strip().lower()

    if unit is None:
        unit_norm = ""
    else:
        unit_norm = unit.strip().lower()

    return name_norm, unit_norm


def create_or_merge_item(
    *, db: Session, shopping_list: ShoppingList, data: ShoppingItemIn
) -> ShoppingItem:
    clean_name = data.name.strip()
    clean_unit = data.unit.strip() if data.unit is not None else None
    name_norm, unit_norm = normalize_key(clean_name, clean_unit)

    recipe_id = data.recipe_id

    existing = db.scalar(
        select(ShoppingItem).where(
            ShoppingItem.list_id == shopping_list.id,
            ShoppingItem.name_norm == name_norm,
            ShoppingItem.unit_norm == unit_norm,
            ShoppingItem.recipe_id == recipe_id,
        )
    )

    if existing:
        existing.quantity += data.quantity
        existing.checked = False
        db.commit()
        db.refresh(existing)
        return existing

    new_item = ShoppingItem(
        user_id=shopping_list.user_id,
        list_id=shopping_list.id,
        recipe_id=recipe_id,
        name=clean_name,
        unit=clean_unit,
        quantity=data.quantity,
        checked=False,
        name_norm=name_norm,
        unit_norm=unit_norm,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


def find_and_merge_existing(
    *,
    db: Session,
    list_id: UUID,
    name: str,
    unit: str | None,
    quantity: float,
    recipe_id: UUID | None = None,
    exclude_item_id: UUID | None = None,
) -> t.Tuple[ShoppingItem | None, str, str]:
    """
    Core logic:
    - normalize (name, unit)
    - find existing item in given list with same normalized key AND same recipe_id
      (optionally excluding one item)
    - if found: merge quantity, uncheck
    - return (existing_or_none, name_norm, unit_norm)
    """
    name_norm, unit_norm = normalize_key(name, unit)

    q = select(ShoppingItem).where(
        ShoppingItem.list_id == list_id,
        ShoppingItem.name_norm == name_norm,
        ShoppingItem.unit_norm == unit_norm,
        ShoppingItem.recipe_id == recipe_id,
    )

    if exclude_item_id is not None:
        q = q.where(ShoppingItem.id != exclude_item_id)

    existing = db.scalar(q)
    if existing:
        existing.quantity += quantity
        existing.checked = False
        return existing, name_norm, unit_norm

    return None, name_norm, unit_norm


def user_can_edit_list(user: User, shopping_list: ShoppingList) -> bool:
    return shopping_list.user_id == user.id or any(
        u.id == user.id for u in shopping_list.shared_with_users
    )


def user_can_edit_recipe(user: User, recipe: Recipe) -> bool:
    return recipe.user_id == user.id or any(
        u.id == user.id for u in recipe.shared_with_users
    )


def list_participants(lst: ShoppingList) -> set[UUID]:
    ids = {lst.user_id}
    ids.update(u.id for u in lst.shared_with_users)
    return ids


def recipe_participants(recipe: Recipe) -> set[UUID]:
    ids = {recipe.user_id}
    ids.update(u.id for u in recipe.shared_with_users)
    return ids
