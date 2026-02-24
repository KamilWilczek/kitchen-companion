from uuid import UUID

from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.category import Category
from app.models.user import User
from app.schemas.category import CategoryIn, CategoryOut
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=list[CategoryOut])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryOut]:
    categories = db.scalars(
        select(Category)
        .where(or_(Category.user_id == current_user.id, Category.user_id.is_(None)))
        .order_by(Category.user_id.is_(None).desc(), Category.name)
    ).all()
    return categories


@router.post("/", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryOut:
    existing = db.scalar(
        select(Category).where(
            Category.user_id == current_user.id,
            Category.name == payload.name,
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    category = Category(
        user_id=current_user.id,
        name=payload.name,
        icon=payload.icon,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@router.put("/{category_id}", response_model=CategoryOut)
def update_category(
    category_id: UUID,
    payload: CategoryIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryOut:
    category = db.get(Category, category_id)
    if not category or category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")

    duplicate = db.scalar(
        select(Category).where(
            Category.user_id == current_user.id,
            Category.name == payload.name,
            Category.id != category_id,
        )
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Category with this name already exists")

    category.name = payload.name
    category.icon = payload.icon
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    category = db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    if category.user_id is None:
        raise HTTPException(status_code=403, detail="Cannot delete system categories")
    if category.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category)
    db.commit()
