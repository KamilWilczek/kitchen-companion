import typing as t
from uuid import UUID, uuid4

import pytest
from app.models.recipe import Ingredient, Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_get_shopping_list_empty(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    response = client.get(
        f"/shopping-lists/{shopping_list.id}/items", headers=auth_headers
    )

    assert response.status_code == 200
    assert response.json() == []


def test_get_shopping_list_returns_items_for_current_user(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    shopping_item_factory(
        name="Milk", quantity=1.0, unit="l", shopping_list=shopping_list
    )
    shopping_item_factory(
        name="Bread", quantity=2.0, unit="pc", shopping_list=shopping_list
    )

    response = client.get(
        f"/shopping-lists/{shopping_list.id}/items", headers=auth_headers
    )

    assert response.status_code == 200
    body = response.json()
    names = {item["name"] for item in body}
    assert names == {"Milk", "Bread"}


def test_add_item_creates_new_item(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    payload = {
        "name": "Sugar",
        "quantity": 500.0,
        "unit": "g",
    }

    response = client.post(
        f"/shopping-lists/{shopping_list.id}/items",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()

    assert body["name"] == "Sugar"
    assert body["quantity"] == 500.0
    assert body["unit"] == "g"
    assert body["checked"] is False
    assert body["recipe_id"] is None

    item_id = UUID(body["id"])
    db_item = db_session.get(ShoppingItem, item_id)
    assert db_item is not None
    assert db_item.name == "Sugar"
    assert db_item.quantity == 500.0
    assert db_item.checked is False
    assert db_item.list_id == shopping_list.id


def test_add_item_merges_same_name_and_unit(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    shopping_list_factory: t.Callable[..., ShoppingList],
    db_session: Session,
) -> None:
    shopping_list = shopping_list_factory()

    shopping_item_factory(
        name="Milk",
        quantity=1.0,
        unit="l",
        checked=True,
        shopping_list=shopping_list,
    )

    payload = {"name": "Milk", "quantity": 0.5, "unit": "l"}
    response = client.post(
        f"/shopping-lists/{shopping_list.id}/items",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 200

    items = db_session.query(ShoppingItem).filter_by(list_id=shopping_list.id).all()
    assert len(items) == 1

    item = items[0]
    assert item.name == "Milk"
    assert item.unit == "l"
    assert item.quantity == 1.5
    assert item.checked is False


def test_update_item_updates_fields(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()
    item = shopping_item_factory(
        name="Milk", quantity=1.0, unit="l", checked=False, shopping_list=shopping_list
    )

    payload = {
        "name": "Almond milk",
        "unit": "ml",
        "quantity": 750.0,
        "checked": True,
    }

    response = client.patch(
        f"/shopping-lists/{shopping_list.id}/items/{item.id}",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Almond milk"
    assert body["unit"] == "ml"
    assert body["quantity"] == 750.0
    assert body["checked"] is True

    db_item = db_session.get(ShoppingItem, item.id)
    assert db_item is not None
    assert db_item.name == "Almond milk"
    assert db_item.unit == "ml"
    assert db_item.quantity == 750.0
    assert db_item.checked is True
    assert db_item.list_id == shopping_list.id


def test_update_item_404_when_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()
    unknown_id = str(uuid4())

    response = client.patch(
        f"/shopping-lists/{shopping_list.id}/items/{unknown_id}",
        json={"name": "Anything"},
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


def test_update_item_404_when_item_belongs_to_other_user(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    my_list = shopping_list_factory()

    other_user = User(email="other@example.com", password_hash="x")
    db_session.add(other_user)
    db_session.flush()

    other_list = ShoppingList(user_id=other_user.id, name="Other list")
    db_session.add(other_list)
    db_session.flush()
    db_session.refresh(other_list)

    other_item = ShoppingItem(
        user_id=other_user.id,
        list_id=other_list.id,
        name="Secret",
        unit="pc",
        quantity=1.0,
        checked=False,
        name_norm="secret",
        unit_norm="pc",
    )
    db_session.add(other_item)
    db_session.commit()

    response = client.patch(
        f"/shopping-lists/{my_list.id}/items/{other_item.id}",
        json={"name": "Hacked"},
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


def test_update_item_merges_with_existing_duplicate_on_name_change(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    shopping_item_factory(
        name="Milk", quantity=1.0, unit="l", checked=False, shopping_list=shopping_list
    )
    item2 = shopping_item_factory(
        name="Sugar", quantity=2.0, unit="l", checked=True, shopping_list=shopping_list
    )

    payload = {
        "name": "Milk",
        "quantity": item2.quantity,
        "unit": item2.unit,
    }
    response = client.patch(
        f"/shopping-lists/{shopping_list.id}/items/{item2.id}",
        json=payload,
        headers=auth_headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "Milk"
    assert body["quantity"] == 3.0
    assert body["checked"] is False

    items = (
        db_session.query(ShoppingItem)
        .filter(ShoppingItem.list_id == shopping_list.id, ShoppingItem.name == "Milk")
        .all()
    )
    assert len(items) == 1
    assert items[0].quantity == 3.0


@pytest.mark.parametrize("invalid_name", ["", " ", "   "])
def test_update_item_rejects_empty_name(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
    invalid_name: str,
) -> None:
    shopping_list = shopping_list_factory()
    item = shopping_item_factory(
        name="Milk", quantity=1.0, unit="l", checked=False, shopping_list=shopping_list
    )

    response = client.patch(
        f"/shopping-lists/{shopping_list.id}/items/{item.id}",
        json={"name": invalid_name},
        headers=auth_headers,
    )

    assert response.status_code == 400
    detail = response.json().get("detail", "")
    assert "name" in detail.lower()

    db_item = db_session.get(ShoppingItem, item.id)
    assert db_item is not None
    assert db_item.name == "Milk"
    assert db_item.quantity == 1.0
    assert db_item.unit == "l"


def test_delete_item_removes_from_db(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()
    item = shopping_item_factory(
        name="To delete", quantity=1.0, unit="pc", shopping_list=shopping_list
    )

    response = client.delete(
        f"/shopping-lists/{shopping_list.id}/items/{item.id}",
        headers=auth_headers,
    )
    assert response.status_code == 204

    deleted = db_session.get(ShoppingItem, item.id)
    assert deleted is None


def test_delete_item_404_when_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()
    unknown_id = str(uuid4())

    response = client.delete(
        f"/shopping-lists/{shopping_list.id}/items/{unknown_id}",
        headers=auth_headers,
    )
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"


def test_clear_list_deletes_all_when_clear_checked_false(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    shopping_item_factory(
        name="Milk", quantity=1.0, unit="l", checked=False, shopping_list=shopping_list
    )
    shopping_item_factory(
        name="Bread", quantity=2.0, unit="pc", checked=True, shopping_list=shopping_list
    )

    response = client.delete(
        f"/shopping-lists/{shopping_list.id}/items",
        headers=auth_headers,
    )
    assert response.status_code == 204

    remaining = db_session.query(ShoppingItem).filter_by(list_id=shopping_list.id).all()
    assert remaining == []


def test_clear_list_deletes_only_checked_when_clear_checked_true(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> None:
    shopping_list = shopping_list_factory()

    unchecked = shopping_item_factory(
        name="Milk", quantity=1.0, unit="l", checked=False, shopping_list=shopping_list
    )
    shopping_item_factory(
        name="Bread", quantity=2.0, unit="pc", checked=True, shopping_list=shopping_list
    )

    response = client.delete(
        f"/shopping-lists/{shopping_list.id}/items?clear_checked=true",
        headers=auth_headers,
    )
    assert response.status_code == 204

    remaining = db_session.query(ShoppingItem).filter_by(list_id=shopping_list.id).all()
    assert len(remaining) == 1
    assert remaining[0].id == unchecked.id
    assert remaining[0].checked is False


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
        f"/shopping-lists/{shopping_list.id}/from-recipe/{recipe.id}",
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
        f"/shopping-lists/{shopping_list.id}/from-recipe/{unknown_id}",
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
        f"/shopping-lists/{shopping_list.id}/from-recipe/{recipe.id}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Recipe not found"
