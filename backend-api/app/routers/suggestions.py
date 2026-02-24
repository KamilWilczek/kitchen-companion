from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.recipe import Ingredient, Recipe
from app.models.shopping_item import ShoppingItem
from app.models.user import User
from fastapi import APIRouter, Depends
from sqlalchemy import func, select, union_all
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=list[str])
def get_suggestions(
    q: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[str]:
    if len(q) < 2:
        return []

    shi_q = select(ShoppingItem.name.label("name")).where(
        ShoppingItem.user_id == current_user.id,
        ShoppingItem.name.ilike(f"{q}%"),
    )

    ing_q = (
        select(Ingredient.name.label("name"))
        .join(Recipe, Recipe.id == Ingredient.recipe_id)
        .where(
            Recipe.user_id == current_user.id,
            Ingredient.name.ilike(f"{q}%"),
        )
    )

    subq = union_all(shi_q, ing_q).subquery()
    rows = db.execute(
        select(subq.c.name, func.count().label("freq"))
        .group_by(subq.c.name)
        .order_by(func.count().desc())
        .limit(8)
    ).all()

    return [row.name for row in rows]
