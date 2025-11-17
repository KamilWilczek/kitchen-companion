import typing as t
from uuid import UUID, uuid4

from app.models.recipe import Ingredient, Recipe
from app.models.shopping_item import ShoppingItem
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


def test_get_shopping_list_empty(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    res = client.get("/shopping-list/", headers=auth_headers)

    assert res.status_code == 200
    assert res.json() == []


def test_get_shopping_list_returns_items_for_current_user(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
) -> None:
    shopping_item_factory(name="Milk", quantity=1.0, unit="l")
    shopping_item_factory(name="Bread", quantity=2.0, unit="pc")

    res = client.get("/shopping-list/", headers=auth_headers)

    assert res.status_code == 200
    body = res.json()
    names = {item["name"] for item in body}
    assert names == {"Milk", "Bread"}


def test_add_item_creates_new_item(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
) -> None:
    payload = {
        "name": "Sugar",
        "quantity": 500.0,
        "unit": "g",
    }

    res = client.post("/shopping-list/", json=payload, headers=auth_headers)

    assert res.status_code == 200
    body = res.json()

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


def test_add_item_merges_same_name_and_unit(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
) -> None:
    shopping_item_factory(name="Milk", quantity=1.0, unit="l", checked=True)

    payload = {"name": "Milk", "quantity": 0.5, "unit": "l"}
    res = client.post("/shopping-list/", json=payload, headers=auth_headers)

    assert res.status_code == 200

    items = db_session.query(ShoppingItem).all()
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
) -> None:
    item = shopping_item_factory(name="Milk", quantity=1.0, unit="l", checked=False)

    payload = {
        "name": "Almond milk",
        "unit": "ml",
        "quantity": 750.0,
        "checked": True,
    }

    res = client.patch(
        f"/shopping-list/{item.id}",
        json=payload,
        headers=auth_headers,
    )

    assert res.status_code == 200
    body = res.json()
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


def test_update_item_404_when_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unknown_id = str(uuid4())

    res = client.patch(
        f"/shopping-list/{unknown_id}",
        json={"name": "Anything"},
        headers=auth_headers,
    )

    assert res.status_code == 404
    assert res.json()["detail"] == "Item not found"


def test_update_item_404_when_item_belongs_to_other_user(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
) -> None:
    other_user = User(email="other@example.com", password_hash="x")
    db_session.add(other_user)
    db_session.flush()

    other_item = ShoppingItem(
        user_id=other_user.id,
        name="Secret",
        unit="pc",
        quantity=1.0,
        checked=False,
        name_norm="secret",
        unit_norm="pc",
    )
    db_session.add(other_item)
    db_session.commit()

    res = client.patch(
        f"/shopping-list/{other_item.id}",
        json={"name": "Hacked"},
        headers=auth_headers,
    )

    assert res.status_code == 404
    assert res.json()["detail"] == "Item not found"


def test_update_item_merges_with_existing_duplicate_on_name_change(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
) -> None:
    shopping_item_factory(name="Milk", quantity=1.0, unit="l", checked=False)
    item2 = shopping_item_factory(name="Sugar", quantity=2.0, unit="l", checked=True)

    # Change Sugar -> Milk, should merge with item1
    payload = {"name": "Milk"}
    res = client.patch(
        f"/shopping-list/{item2.id}",
        json=payload,
        headers=auth_headers,
    )

    assert res.status_code == 200
    body = res.json()
    assert body["name"] == "Milk"
    assert body["quantity"] == 3.0
    assert body["checked"] is False

    items = db_session.query(ShoppingItem).filter(ShoppingItem.name == "Milk").all()
    assert len(items) == 1
    assert items[0].quantity == 3.0


def test_delete_item_removes_from_db(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
) -> None:
    item = shopping_item_factory(name="To delete", quantity=1.0, unit="pc")

    res = client.delete(f"/shopping-list/{item.id}", headers=auth_headers)
    assert res.status_code == 204

    deleted = db_session.get(ShoppingItem, item.id)
    assert deleted is None


def test_delete_item_404_when_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unknown_id = str(uuid4())

    res = client.delete(f"/shopping-list/{unknown_id}", headers=auth_headers)
    assert res.status_code == 404
    assert res.json()["detail"] == "Item not found"


def test_clear_list_deletes_all_when_clear_checked_false(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
) -> None:
    shopping_item_factory(name="Milk", quantity=1.0, unit="l", checked=False)
    shopping_item_factory(name="Bread", quantity=2.0, unit="pc", checked=True)

    res = client.delete("/shopping-list/", headers=auth_headers)
    assert res.status_code == 204

    remaining = db_session.query(ShoppingItem).all()
    assert remaining == []


def test_clear_list_deletes_only_checked_when_clear_checked_true(
    client: TestClient,
    auth_headers: dict[str, str],
    shopping_item_factory: t.Callable[..., ShoppingItem],
    db_session: Session,
) -> None:
    unchecked = shopping_item_factory(
        name="Milk", quantity=1.0, unit="l", checked=False
    )
    shopping_item_factory(name="Bread", quantity=2.0, unit="pc", checked=True)

    res = client.delete(
        "/shopping-list/?clear_checked=true",
        headers=auth_headers,
    )
    assert res.status_code == 204

    remaining = db_session.query(ShoppingItem).all()
    assert len(remaining) == 1
    assert remaining[0].id == unchecked.id
    assert remaining[0].checked is False


def test_add_from_recipe_adds_all_ingredients(
    client: TestClient,
    auth_headers: dict[str, str],
    recipe_factory: t.Callable[..., Recipe],
    db_session: Session,
) -> None:
    recipe = recipe_factory(
        title="Pancakes",
        description="desc",
        source=None,
        ingredients=[
            {"name": "Flour", "quantity": 200.0, "unit": "g"},
            {"name": "Milk", "quantity": 300.0, "unit": "ml"},
        ],
    )

    res = client.post(
        f"/shopping-list/from-recipe/{recipe.id}",
        headers=auth_headers,
    )

    assert res.status_code == 200
    body = res.json()
    assert len(body) == 2

    names = {i["name"] for i in body}
    assert names == {"Flour", "Milk"}

    for item in body:
        assert item["recipe_id"] == str(recipe.id)
        assert item["checked"] is False

    db_items = (
        db_session.query(ShoppingItem).filter(ShoppingItem.recipe_id == recipe.id).all()
    )
    assert len(db_items) == 2


def test_add_from_recipe_404_when_recipe_not_found(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    unknown_id = str(uuid4())

    res = client.post(
        f"/shopping-list/from-recipe/{unknown_id}",
        headers=auth_headers,
    )

    assert res.status_code == 404
    assert res.json()["detail"] == "Recipe not found"


def test_add_from_recipe_404_when_recipe_belongs_to_other_user(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
) -> None:
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

    res = client.post(
        f"/shopping-list/from-recipe/{recipe.id}",
        headers=auth_headers,
    )

    assert res.status_code == 404
    assert res.json()["detail"] == "Recipe not found"
