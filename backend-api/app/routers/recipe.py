from uuid import UUID

from app.actions import (
    create_or_merge_item,
    list_participants,
    recipe_participants,
    user_can_edit_list,
    user_can_edit_recipe,
)
from app.core.db import get_db
from app.core.deps import get_current_user
from app.models.recipe import Ingredient, Recipe, recipe_shares
from app.models.shopping_item import ShoppingList
from app.models.tag import Tag
from app.models.user import User
from app.schemas.recipe import (
    IngredientsToShoppingList,
    RecipeIn,
    RecipeOut,
    RecipeShareIn,
)
from app.schemas.shopping_item import ShoppingItemIn, ShoppingItemOut
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

router = APIRouter()


@router.get("/", response_model=list[RecipeOut])
def get_recipes(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[RecipeOut]:
    q = (
        select(Recipe)
        .outerjoin(recipe_shares, recipe_shares.c.recipe_id == Recipe.id)
        .where(
            or_(
                Recipe.user_id == current_user.id,
                recipe_shares.c.user_id == current_user.id,
            )
        )
        .distinct()
    )
    return db.scalars(q).all()


@router.post("/", response_model=RecipeOut)
def add_recipe(
    recipe_in: RecipeIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecipeOut:
    recipe = Recipe(
        user_id=current_user.id,
        title=recipe_in.title,
        description=recipe_in.description,
        source=recipe_in.source,
    )

    recipe.ingredients = [
        Ingredient(name=ing.name, quantity=ing.quantity, unit=ing.unit)
        for ing in recipe_in.ingredients
    ]

    if recipe_in.tag_ids:
        recipe.tags = db.scalars(select(Tag).where(Tag.id.in_(recipe_in.tag_ids))).all()

    db.add(recipe)
    db.commit()
    db.refresh(recipe)
    return recipe


@router.put("/{recipe_id}", response_model=RecipeOut)
def update_recipe(
    recipe_id: UUID,
    recipe_in: RecipeIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> RecipeOut:
    recipe = db.get(Recipe, recipe_id)
    if not recipe or not user_can_edit_recipe(current_user, recipe):
        raise HTTPException(status_code=404, detail="Recipe not found")

    recipe.title = recipe_in.title
    recipe.description = recipe_in.description
    recipe.source = recipe_in.source

    recipe.ingredients.clear()
    recipe.ingredients.extend(
        Ingredient(name=ing.name, quantity=ing.quantity, unit=ing.unit)
        for ing in recipe_in.ingredients
    )

    if recipe_in.tag_ids:
        recipe.tags = db.scalars(select(Tag).where(Tag.id.in_(recipe_in.tag_ids))).all()
    else:
        recipe.tags = []

    db.commit()
    db.refresh(recipe)
    return recipe


@router.delete("/{recipe_id}", status_code=204)
def delete_recipe(
    recipe_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    recipe = db.scalar(
        select(Recipe).where(Recipe.id == recipe_id, Recipe.user_id == current_user.id)
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    db.delete(recipe)
    db.commit()
    return None


@router.post("/{recipe_id}/share", status_code=204)
def share_recipe(
    recipe_id: UUID,
    payload: RecipeShareIn,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    recipe = db.scalar(
        select(Recipe).where(
            Recipe.id == recipe_id,
            Recipe.user_id == current_user.id,
        )
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    if payload.shared_with_email == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot share recipe with yourself")

    shared_user = db.scalar(select(User).where(User.email == payload.shared_with_email))
    if not shared_user:
        raise HTTPException(status_code=404, detail="User to share with not found")

    if any(u.id == shared_user.id for u in recipe.shared_with_users):
        return None

    recipe.shared_with_users.append(shared_user)

    db.commit()
    return None


@router.delete("/{recipe_id}/share/{user_id}", status_code=204)
def unshare_recipe(
    recipe_id: UUID,
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    recipe = db.scalar(
        select(Recipe).where(
            Recipe.id == recipe_id,
            Recipe.user_id == current_user.id,
        )
    )
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    shared_user = db.scalar(select(User).where(User.id == user_id))
    if not shared_user:
        raise HTTPException(status_code=404, detail="User to unshare with not found")

    if all(u.id != shared_user.id for u in recipe.shared_with_users):
        return None

    recipe.shared_with_users.remove(shared_user)

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
            detail=(
                "Cannot add ingredients from this recipe to a list that includes "
                "users without access to the recipe."
            ),
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


@router.post(
    "/{recipe_id}/shopping-lists/{list_id}/items",
    response_model=list[ShoppingItemOut],
)
def add_selected_ingredients_to_shopping_list(
    recipe_id: UUID,
    list_id: UUID,
    payload: IngredientsToShoppingList,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ShoppingItemOut]:
    # 1. Load recipe & check access
    recipe = db.get(Recipe, recipe_id)
    if not recipe or not user_can_edit_recipe(current_user, recipe):
        raise HTTPException(status_code=404, detail="Recipe not found")

    # 2. Load shopping list & check access
    shopping_list = db.get(ShoppingList, list_id)
    if not shopping_list or not user_can_edit_list(current_user, shopping_list):
        raise HTTPException(status_code=404, detail="List not found")

    # 3. Check sharing rules (same as full add_from_recipe)
    list_users = list_participants(shopping_list)
    recipe_users = recipe_participants(recipe)

    leaking_to_others = list_users - recipe_users
    if leaking_to_others:
        raise HTTPException(
            status_code=403,
            detail=(
                "Cannot add ingredients from this recipe to a list that includes "
                "users without access to the recipe."
            ),
        )

    if not payload.ingredient_ids:
        # you can also choose to just return [] silently; I prefer explicit error
        raise HTTPException(status_code=400, detail="No ingredients selected.")

    # 4. Fetch selected ingredients, ensure they belong to this recipe
    ingredients = db.scalars(
        select(Ingredient).where(
            Ingredient.recipe_id == recipe_id,
            Ingredient.id.in_(payload.ingredient_ids),
        )
    ).all()

    if len(ingredients) != len(set(payload.ingredient_ids)):
        # at least one id doesn't belong to this recipe or doesn't exist
        raise HTTPException(
            status_code=400,
            detail="One or more selected ingredients are invalid for this recipe.",
        )

    # 5. Add each ingredient as a ShoppingItem row (per-source model)
    added: list[ShoppingItemOut] = []
    for ing in ingredients:
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
