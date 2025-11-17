import typing as t
from uuid import uuid4

from app.models.recipe import Ingredient, Recipe
from app.models.tag import Tag
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

    payload = {
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


def test_add_recipe_rejects_unknown_field_tags(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    payload = {
        "title": "Bad recipe",
        "description": "Should fail",
        "source": None,
        "ingredients": [],
        "tags": [],
    }

    res = client.post("/recipes/", json=payload, headers=auth_headers)

    assert res.status_code == 422
