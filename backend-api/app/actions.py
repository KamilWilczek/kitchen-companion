import typing as t
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recipe import Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.user import User
from app.schemas.shopping_item import ShoppingItemIn


def normalize_key(name: str, unit: str) -> tuple[str, str]:
    return name.strip().lower(), unit.strip().lower()


def create_or_merge_item(
    *, db: Session, shopping_list: ShoppingList, data: ShoppingItemIn
) -> ShoppingItem:
    existing, name_norm, unit_norm = _find_and_merge_existing(
        db=db,
        list_id=shopping_list.id,
        name=data.name,
        unit=data.unit,
        quantity=data.quantity,
        recipe_id=data.recipe_id,
        exclude_item_id=None,
    )

    if existing:
        db.commit()
        db.refresh(existing)
        return existing

    new_item = ShoppingItem(
        user_id=shopping_list.user_id,
        list_id=shopping_list.id,
        name=data.name.strip(),
        unit=data.unit.strip(),
        quantity=data.quantity,
        checked=False,
        recipe_id=data.recipe_id if data.recipe_id else None,
        name_norm=name_norm,
        unit_norm=unit_norm,
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


def _find_and_merge_existing(
    *,
    db: Session,
    list_id: UUID,
    name: str,
    unit: str,
    quantity: float,
    recipe_id: UUID | None = None,
    exclude_item_id: UUID | None = None,
) -> t.Tuple[ShoppingItem | None, str, str]:
    """
    Core logic:
    - normalize (name, unit)
    - find existing item in given list with same normalized key (optionally excluding one item)
    - if found: merge quantity, uncheck, maybe set recipe_id
    - return (existing_or_none, name_norm, unit_norm)
    """
    name_norm, unit_norm = normalize_key(name, unit)

    q = select(ShoppingItem).where(
        ShoppingItem.list_id == list_id,
        ShoppingItem.name_norm == name_norm,
        ShoppingItem.unit_norm == unit_norm,
    )
    if exclude_item_id is not None:
        q = q.where(ShoppingItem.id != exclude_item_id)

    existing = db.scalar(q)
    if existing:
        existing.quantity += quantity
        existing.checked = False
        if not existing.recipe_id and recipe_id:
            existing.recipe_id = recipe_id
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
