import typing as t
from uuid import uuid4

from app.models.recipe import Ingredient, Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.tag import Tag
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_get_recipes_empty(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    res = client.get("/recipes/", headers=auth_headers)

    assert res.status_code == 200
    assert res.json() == []


def test_get_recipes_returns_recipes_for_current_user(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
) -> None:
    recipe_factory(title="R1")
    recipe_factory(title="R2")

    res = client.get("/recipes/", headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    titles = {r["title"] for r in body}
    assert titles == {"R1", "R2"}


def test_get_recipes_for_shared_user(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
    db_session: Session,
    user_factory: t.Callable[..., t.Any],
) -> None:
    current_user = db_session.query(User).filter_by(email="test@example.com").one()
    owner = user_factory(email="owner@example.com")
    shared_recipe = recipe_factory(title="Shared recipe", tags=[], ingredients=[])
    shared_recipe.user_id = owner.id
    shared_recipe.shared_with_users.append(current_user)
    db_session.commit()

    response = client.get("/recipes/", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert "Shared recipe" in body[0]["title"]


def test_add_recipe_with_ingredients_and_tags(
    client: TestClient,
    auth_headers: dict[str, str],
    tag_factory: t.Callable[..., list[Tag]],
) -> None:
    t1, t2 = tag_factory("breakfast", "quick")

    payload = {
        "title": "Pancakes",
        "description": "Fluffy and nice",
        "source": "Grandma",
        "ingredients": [
            {"name": "Flour", "quantity": 200, "unit": "g"},
            {"name": "Milk", "quantity": 300, "unit": "ml"},
        ],
        "tag_ids": [str(t1.id), str(t2.id)],
    }

    res = client.post("/recipes/", json=payload, headers=auth_headers)

    assert res.status_code == 200
    body = res.json()

    assert body["title"] == "Pancakes"
    assert body["description"] == "Fluffy and nice"

    assert len(body["ingredients"]) == 2
    ing_names = {i["name"] for i in body["ingredients"]}
    assert ing_names == {"Flour", "Milk"}

    tag_names = {t["name"] for t in body["tags"]}
    assert tag_names == {"breakfast", "quick"}


def test_update_recipe_replaces_ingredients_and_tags(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
    tag_factory: t.Callable[..., list[Tag]],
) -> None:
    (old_tag, new_tag) = tag_factory("old", "new")

    recipe = recipe_factory(
        title="Old title",
        description="Old desc",
        source="Book",
        ingredients=[
            {"name": "Old ingredient", "quantity": 1, "unit": "pc"},
        ],
        tags=[old_tag],
    )

    payload = {
        "title": "New title",
        "description": "New desc",
        "source": "Internet",
        "ingredients": [
            {"name": "Flour", "quantity": 100, "unit": "g"},
            {"name": "Eggs", "quantity": 2, "unit": "pc"},
        ],
        "tag_ids": [str(new_tag.id)],
    }

    res = client.put(f"/recipes/{recipe.id}", json=payload, headers=auth_headers)

    assert res.status_code == 200
    body = res.json()

    assert body["title"] == "New title"
    assert body["description"] == "New desc"

    assert len(body["ingredients"]) == 2
    ing_names = {i["name"] for i in body["ingredients"]}
    assert ing_names == {"Flour", "Eggs"}

    tag_names = {t["name"] for t in body["tags"]}
    assert tag_names == {"new"}


def test_update_recipe_by_shared_user(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
    db_session: Session,
    user_factory: t.Callable[..., t.Any],
) -> None:
    current_user = db_session.query(User).filter_by(email="test@example.com").one()
    owner = user_factory(email="owner@example.com")
    shared_recipe = recipe_factory(title="Shared recipe", tags=[], ingredients=[])
    shared_recipe.user_id = owner.id
    shared_recipe.shared_with_users.append(current_user)
    db_session.commit()

    payload = {
        "title": "Updated title",
        "description": "Updated desc",
        "source": "Updated source",
        "ingredients": [
            {"name": "Updated ingredient", "quantity": 2, "unit": "pc"},
        ],
        "tag_ids": [],
    }

    response = client.put(
        f"/recipes/{shared_recipe.id}", json=payload, headers=auth_headers
    )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "Updated title"
    assert body["description"] == "Updated desc"


def test_update_recipe_clears_tags_when_tag_ids_empty(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
    tag_factory: t.Callable[..., list[Tag]],
) -> None:
    (tag,) = tag_factory("to-be-removed")

    recipe = recipe_factory(
        title="Tagged recipe",
        ingredients=[
            {"name": "Sugar", "quantity": 10, "unit": "g"},
        ],
        tags=[tag],
    )

    payload = {
        "title": "Tagged recipe",
        "description": "",
        "source": None,
        "ingredients": [
            {"name": "Sugar", "quantity": 10, "unit": "g"},
        ],
        "tag_ids": [],
    }

    res = client.put(f"/recipes/{recipe.id}", json=payload, headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    assert body["tags"] == []


def test_update_recipe_not_found_returns_404(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unknown_id = str(uuid4())

    payload: dict[str, object] = {
        "title": "Doesn't matter",
        "description": "",
        "source": None,
        "ingredients": [],
        "tag_ids": [],
    }

    res = client.put(f"/recipes/{unknown_id}", json=payload, headers=auth_headers)

    assert res.status_code == 404
    assert res.json()["detail"] == "Recipe not found"


def test_delete_recipe(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
    db_session: Session,
) -> None:
    recipe = recipe_factory(
        title="To delete",
        ingredients=[
            {"name": "Flour", "quantity": 100, "unit": "g"},
        ],
    )

    res = client.delete(f"/recipes/{recipe.id}", headers=auth_headers)

    assert res.status_code == 204

    deleted = db_session.get(Recipe, recipe.id)
    assert deleted is None

    remaining_ings = (
        db_session.query(Ingredient).filter(Ingredient.recipe_id == recipe.id).all()
    )
    assert remaining_ings == []


def test_delete_recipe_not_found_returns_404(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unknown_id = str(uuid4())

    res = client.delete(f"/recipes/{unknown_id}", headers=auth_headers)

    assert res.status_code == 404
    assert res.json()["detail"] == "Recipe not found"


def test_delete_recipe_by_shared_user(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
    db_session: Session,
    user_factory: t.Callable[..., t.Any],
) -> None:
    current_user = db_session.query(User).filter_by(email="test@example.com").one()
    owner = user_factory(email="owner@example.com")
    shared_recipe = recipe_factory(title="Shared recipe", tags=[], ingredients=[])
    shared_recipe.user_id = owner.id
    shared_recipe.shared_with_users.append(current_user)
    db_session.commit()

    response = client.delete(f"/recipes/{shared_recipe.id}", headers=auth_headers)
    assert response.status_code == 404


def test_add_recipe_rejects_unknown_field_tags(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    payload: dict[str, object] = {
        "title": "Bad recipe",
        "description": "Should fail",
        "source": None,
        "ingredients": [],
        "tags": [],
    }

    res = client.post("/recipes/", json=payload, headers=auth_headers)

    assert res.status_code == 422


def test_add_from_recipe_adds_all_ingredients(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    recipe = recipe_factory(
        title="Pancakes",
        description="desc",
        source=None,
        ingredients=[
            {"name": "Flour", "quantity": 200.0, "unit": "g"},
            {"name": "Milk", "quantity": 300.0, "unit": "ml"},
        ],
    )

    response = client.post(
        f"/recipes/{shopping_list.id}/from-recipe/{recipe.id}",
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2

    names = {i["name"] for i in body}
    assert names == {"Flour", "Milk"}

    for item in body:
        assert item["recipe_id"] == str(recipe.id)
        assert item["checked"] is False

    db_items = (
        db_session.query(ShoppingItem)
        .filter(
            ShoppingItem.recipe_id == recipe.id,
            ShoppingItem.list_id == shopping_list.id,
        )
        .all()
    )
    assert len(db_items) == 2


def test_add_from_recipe_404_when_recipe_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()
    unknown_id = str(uuid4())

    response = client.post(
        f"/recipes/{shopping_list.id}/from-recipe/{unknown_id}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe not found"


def test_add_from_recipe_404_when_recipe_belongs_to_other_user(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    other_user = User(email="other@example.com", password_hash="x")
    db_session.add(other_user)
    db_session.flush()

    recipe = Recipe(
        user_id=other_user.id,
        title="Secret",
        description="desc",
        source=None,
    )
    recipe.ingredients = [
        Ingredient(name="Hidden", quantity=1.0, unit="pc"),
    ]
    db_session.add(recipe)
    db_session.commit()
    db_session.refresh(recipe)

    response = client.post(
        f"/recipes/{shopping_list.id}/from-recipe/{recipe.id}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe not found"


def test_add_from_recipe_allowed_from_shared_recipe_to_private_list(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    user_factory: t.Callable[..., User],
    recipe_factory: t.Callable[..., Recipe],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    user_b = db_session.query(User).filter_by(email="test@example.com").one()
    user_a = user_factory(email="a@example.com")

    recipe = recipe_factory(
        user=user_a,
        title="A's recipe",
        ingredients=[
            {"name": "Flour", "quantity": 200.0, "unit": "g"},
            {"name": "Milk", "quantity": 300.0, "unit": "ml"},
        ],
    )

    recipe.shared_with_users.append(user_b)
    db_session.commit()

    list_b = shopping_list_factory(user=user_b, name="B-only list")

    res = client.post(
        f"/recipes/{list_b.id}/from-recipe/{recipe.id}",
        headers=auth_headers,
    )

    assert res.status_code == 200
    body = res.json()
    assert len(body) == 2
    names = {i["name"] for i in body}
    assert names == {"Flour", "Milk"}


def test_add_from_recipe_allowed_from_shared_recipe_to_shared_list(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    user_factory: t.Callable[..., User],
    recipe_factory: t.Callable[..., Recipe],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    user_b = db_session.query(User).filter_by(email="test@example.com").one()
    user_a = user_factory(email="a@example.com")

    recipe = recipe_factory(
        user=user_a,
        title="A's recipe",
        ingredients=[
            {"name": "Flour", "quantity": 200.0, "unit": "g"},
            {"name": "Milk", "quantity": 300.0, "unit": "ml"},
        ],
    )

    recipe.shared_with_users.append(user_b)
    db_session.commit()

    list_ab = shopping_list_factory(user=user_a, name="A+B list")
    list_ab.shared_with_users.append(user_b)
    db_session.commit()

    res = client.post(
        f"/recipes/{list_ab.id}/from-recipe/{recipe.id}",
        headers=auth_headers,
    )

    assert res.status_code == 200
    body = res.json()
    assert len(body) == 2
    names = {i["name"] for i in body}
    assert names == {"Flour", "Milk"}


def test_add_from_recipe_forbidden_when_list_has_member_without_recipe_access(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    user_factory: t.Callable[..., User],
    recipe_factory: t.Callable[..., Recipe],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    user_b = db_session.query(User).filter_by(email="test@example.com").one()
    user_a = user_factory(email="a@example.com")
    user_c = user_factory(email="c@example.com")

    recipe = recipe_factory(
        user=user_a,
        title="A's recipe",
        ingredients=[
            {"name": "Flour", "quantity": 200.0, "unit": "g"},
            {"name": "Milk", "quantity": 300.0, "unit": "ml"},
        ],
    )

    recipe.shared_with_users.append(user_b)
    db_session.commit()

    list_bc = shopping_list_factory(user=user_b, name="B+C list")
    list_bc.shared_with_users.append(user_c)
    db_session.commit()

    res = client.post(
        f"/recipes/{list_bc.id}/from-recipe/{recipe.id}",
        headers=auth_headers,
    )

    assert res.status_code == 403
    detail = res.json().get("detail", "").lower()
    assert "recipe" in detail or "access" in detail


def test_add_from_recipe_keeps_manual_item_separate(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    recipe_factory: t.Callable[..., Recipe],
) -> None:
    shopping_list = shopping_list_factory()

    shopping_item_factory(
        name="Tomato",
        quantity=1.0,
        unit="szt.",
        checked=False,
        shopping_list=shopping_list,
    )

    recipe = recipe_factory(
        title="Tomato Soup",
        ingredients=[{"name": "Tomato", "quantity": 3.0, "unit": "szt."}],
    )

    response = client.post(
        f"/recipes/{shopping_list.id}/from-recipe/{recipe.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200

    items = (
        db_session.query(ShoppingItem)
        .filter(ShoppingItem.list_id == shopping_list.id, ShoppingItem.name == "Tomato")
        .all()
    )
    assert len(items) == 2

    manual = next(i for i in items if i.recipe_id is None)
    from_recipe = next(i for i in items if i.recipe_id == recipe.id)

    assert manual.quantity == 1.0
    assert from_recipe.quantity == 3.0


def test_add_from_recipe_merges_with_existing_recipe_item(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    recipe_factory: t.Callable[..., Recipe],
) -> None:
    shopping_list = shopping_list_factory()

    recipe = recipe_factory(
        title="Pancakes",
        ingredients=[
            {"name": "Flour", "quantity": 200.0, "unit": "g"},
            {"name": "Milk", "quantity": 300.0, "unit": "ml"},
        ],
    )

    shopping_item_factory(
        name="Flour",
        quantity=200.0,
        unit="g",
        checked=False,
        shopping_list=shopping_list,
        recipe_id=recipe.id,
    )

    response = client.post(
        f"/recipes/{shopping_list.id}/from-recipe/{recipe.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200

    flour_items = (
        db_session.query(ShoppingItem)
        .filter(
            ShoppingItem.list_id == shopping_list.id,
            ShoppingItem.name == "Flour",
            ShoppingItem.unit == "g",
            ShoppingItem.recipe_id == recipe.id,
        )
        .all()
    )
    assert len(flour_items) == 1
    assert flour_items[0].quantity == 400.0


def test_add_from_recipe_does_not_merge_items_from_other_recipes(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    recipe_factory: t.Callable[..., Recipe],
) -> None:
    shopping_list = shopping_list_factory()

    recipe1 = recipe_factory(
        title="Tomato Soup",
        ingredients=[{"name": "Tomato", "quantity": 3.0, "unit": "szt."}],
    )
    recipe2 = recipe_factory(
        title="Tomato Pasta",
        ingredients=[{"name": "Tomato", "quantity": 4.0, "unit": "szt."}],
    )

    shopping_item_factory(
        name="Tomato",
        quantity=3.0,
        unit="szt.",
        checked=False,
        shopping_list=shopping_list,
        recipe_id=recipe1.id,
    )

    response = client.post(
        f"/recipes/{shopping_list.id}/from-recipe/{recipe2.id}",
        headers=auth_headers,
    )
    assert response.status_code == 200

    items = (
        db_session.query(ShoppingItem)
        .filter(ShoppingItem.list_id == shopping_list.id, ShoppingItem.name == "Tomato")
        .all()
    )

    assert len(items) == 2
    qty_by_recipe = {i.recipe_id: i.quantity for i in items}
    assert qty_by_recipe[recipe1.id] == 3.0
    assert qty_by_recipe[recipe2.id] == 4.0


def test_add_selected_ingredients_from_recipe_to_shopping_list(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    recipe_factory: t.Callable[..., Recipe],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    recipe = recipe_factory(
        title="Tomato Sauce",
        description="desc",
        source=None,
        ingredients=[
            {"name": "Tomato pulp", "quantity": 1.0, "unit": "op."},
            {"name": "Olive oil", "quantity": 10.0, "unit": "ml"},
            {"name": "Oregano", "quantity": 1.0, "unit": "g"},
            {"name": "Basil", "quantity": 1.0, "unit": "g"},
        ],
    )

    db_session.refresh(recipe)
    ing_by_name = {ing.name: ing for ing in recipe.ingredients}
    tomato = ing_by_name["Tomato pulp"]
    oregano = ing_by_name["Oregano"]

    payload = {
        "ingredient_ids": [str(tomato.id), str(oregano.id)],
    }

    response = client.post(
        f"/recipes/{recipe.id}/shopping-lists/{shopping_list.id}/items",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 2

    names = {item["name"] for item in body}
    assert names == {"Tomato pulp", "Oregano"}

    for item in body:
        assert item["recipe_id"] == str(recipe.id)
        assert item["checked"] is False

    db_items = (
        db_session.query(ShoppingItem)
        .filter(
            ShoppingItem.list_id == shopping_list.id,
            ShoppingItem.recipe_id == recipe.id,
        )
        .all()
    )
    assert len(db_items) == 2
    assert {i.name for i in db_items} == {"Tomato pulp", "Oregano"}


def test_put_preserves_other_users_tags(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    recipe_factory: t.Callable[..., Recipe],
    tag_factory: t.Callable[..., list[Tag]],
    user_factory: t.Callable[..., User],
) -> None:
    """PUT by UserB must not remove tags that UserA assigned to the recipe."""
    current_user = db_session.query(User).filter_by(email="test@example.com").one()
    owner = user_factory()

    (owner_tag,) = tag_factory("veggie", user_id=owner.id)
    (my_tag,) = tag_factory("quick")

    recipe = recipe_factory(user=owner, tags=[owner_tag])
    recipe.shared_with_users.append(current_user)
    db_session.commit()

    payload = {
        "title": recipe.title,
        "description": recipe.description,
        "source": recipe.source,
        "ingredients": [],
        "tag_ids": [str(my_tag.id)],
    }

    res = client.put(f"/recipes/{recipe.id}", json=payload, headers=auth_headers)

    assert res.status_code == 200
    tag_names = {t["name"] for t in res.json()["tags"]}
    assert "veggie" in tag_names
    assert "quick" in tag_names


def test_patch_preserves_other_users_tags(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    recipe_factory: t.Callable[..., Recipe],
    tag_factory: t.Callable[..., list[Tag]],
    user_factory: t.Callable[..., User],
) -> None:
    """PATCH clearing tag_ids must only clear the editing user's own tags."""
    current_user = db_session.query(User).filter_by(email="test@example.com").one()
    owner = user_factory()

    (owner_tag,) = tag_factory("veggie", user_id=owner.id)

    recipe = recipe_factory(user=owner, tags=[owner_tag])
    recipe.shared_with_users.append(current_user)
    db_session.commit()

    res = client.patch(
        f"/recipes/{recipe.id}",
        json={"tag_ids": []},
        headers=auth_headers,
    )

    assert res.status_code == 200
    tag_names = {t["name"] for t in res.json()["tags"]}
    assert "veggie" in tag_names
