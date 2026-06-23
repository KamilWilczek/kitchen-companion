from datetime import date, timedelta

from app.core.db import get_db
from app.core.deps import require_premium
from app.models.meal_plan import MealPlanEntry
from app.models.recipe import Recipe
from app.models.user import User
from app.schemas.meal_plan import AssignRecipeRequest, MealPlanEntryOut, VALID_SLOTS
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=list[MealPlanEntryOut])
def get_week(
    week_start: date = Query(..., description="Monday of the week (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
):
    week_end = week_start + timedelta(days=7)
    entries = db.scalars(
        select(MealPlanEntry).where(
            MealPlanEntry.user_id == current_user.id,
            MealPlanEntry.date >= week_start,
            MealPlanEntry.date < week_end,
        )
    ).all()
    return entries


@router.put("/{entry_date}/{slot}", response_model=MealPlanEntryOut, status_code=status.HTTP_200_OK)
def assign_recipe(
    entry_date: date,
    slot: str,
    body: AssignRecipeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
):
    if slot not in VALID_SLOTS:
        raise HTTPException(status_code=400, detail=f"Invalid slot. Must be one of: {', '.join(VALID_SLOTS)}")

    recipe = db.scalar(
        select(Recipe).where(Recipe.id == body.recipe_id, Recipe.user_id == current_user.id)
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    entry = db.scalar(
        select(MealPlanEntry).where(
            MealPlanEntry.user_id == current_user.id,
            MealPlanEntry.date == entry_date,
            MealPlanEntry.meal_slot == slot,
        )
    )
    if entry:
        entry.recipe_id = body.recipe_id
    else:
        entry = MealPlanEntry(
            user_id=current_user.id,
            date=entry_date,
            meal_slot=slot,
            recipe_id=body.recipe_id,
        )
        db.add(entry)

    db.commit()
    db.refresh(entry)
    return entry


@router.delete("/{entry_date}/{slot}", status_code=status.HTTP_204_NO_CONTENT)
def remove_recipe(
    entry_date: date,
    slot: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_premium),
):
    if slot not in VALID_SLOTS:
        raise HTTPException(status_code=400, detail=f"Invalid slot. Must be one of: {', '.join(VALID_SLOTS)}")

    entry = db.scalar(
        select(MealPlanEntry).where(
            MealPlanEntry.user_id == current_user.id,
            MealPlanEntry.date == entry_date,
            MealPlanEntry.meal_slot == slot,
        )
    )
    if entry:
        db.delete(entry)
        db.commit()
