from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.shopping_item import ShoppingItem
from app.models.user import User
from app.schemas.shopping_item import (
    ShoppingItemIn,
)


def normalize_key(name: str, unit: str) -> tuple[str, str]:
    return name.strip().lower(), unit.strip().lower()


def create_or_merge_item(
    *, db: Session, user: User, data: ShoppingItemIn
) -> ShoppingItem:
    name_norm, unit_norm = normalize_key(data.name, data.unit)
    existing = db.scalar(
        select(ShoppingItem).where(
            ShoppingItem.user_id == user.id,
            ShoppingItem.name_norm == name_norm,
            ShoppingItem.unit_norm == unit_norm,
        )
    )
    if existing:
        existing.quantity += data.quantity
        existing.checked = False
        if not existing.recipe_id and data.recipe_id:
            existing.recipe_id = data.recipe_id
        db.commit()
        db.refresh(existing)
        return existing

    new_item = ShoppingItem(
        user_id=user.id,
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
