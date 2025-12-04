import typing as t
from uuid import UUID, uuid4

import pytest
from app.models.recipe import Ingredient, Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestShoppingLists:
    def test_create_shopping_list(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
    ) -> None:
        payload = {"name": "Weekly groceries"}

        response = client.post("/shopping-lists", json=payload, headers=auth_headers)

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Weekly groceries"
        assert "id" in body

        list_id = UUID(body["id"])
        shopping_list = db_session.get(ShoppingList, list_id)
        assert shopping_list is not None
        assert shopping_list.name == "Weekly groceries"

    def test_create_shopping_list_rejects_empty_name(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        payload = {"name": "   "}

        response = client.post("/shopping-lists", json=payload, headers=auth_headers)

        assert response.status_code == 422
        body = response.json()
        assert body["detail"][0]["msg"] == "Value error, Name cannot be empty"

    def test_get_shopping_list(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list = shopping_list_factory(name="Party supplies")

        response = client.get(
            f"/shopping-lists/{shopping_list.id}", headers=auth_headers
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Party supplies"
        assert body["id"] == str(shopping_list.id)

    def test_get_shopping_list_includes_shared(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list = shopping_list_factory(user=owner, name="Shared list")
        shopping_list.shared_with_users.append(current_user)
        db_session.commit()

        response = client.get(
            f"/shopping-lists/{shopping_list.id}", headers=auth_headers
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Shared list"

    def test_get_shopping_lists(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list_factory(name="List 1")
        shopping_list_factory(name="List 2")

        response = client.get("/shopping-lists", headers=auth_headers)

        assert response.status_code == 200
        body = response.json()
        names = {item["name"] for item in body}
        assert names == {"List 1", "List 2"}

    def test_get_shopping_list_404_when_not_found(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        unknown_id = str(uuid4())

        response = client.get(f"/shopping-lists/{unknown_id}", headers=auth_headers)

        assert response.status_code == 404
        assert response.json()["detail"] == "List not found"

    def test_get_shopping_lists_includes_shared(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list_factory(user=current_user, name="Current user's list")
        shopping_list_factory(user=owner, name="Other user's not shared list")
        shared_list = shopping_list_factory(user=owner, name="Other user's shared list")

        shared_list.shared_with_users.append(current_user)
        db_session.commit()

        response = client.get("/shopping-lists/", headers=auth_headers)

        assert response.status_code == 200
        body = response.json()
        names = {shopping_list["name"] for shopping_list in body}

        assert names == {"Current user's list", "Other user's shared list"}
        assert "Other user's not shared list" not in names

    def test_update_shopping_list(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list = shopping_list_factory(name="Old name", description="Old desc")

        payload = {"name": "New name", "description": "New desc"}

        response = client.patch(
            f"/shopping-lists/{shopping_list.id}", json=payload, headers=auth_headers
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "New name"
        assert body["description"] == "New desc"

        db_session.refresh(shopping_list)
        assert shopping_list.name == "New name"
        assert shopping_list.description == "New desc"

    def test_update_shopping_list_404_when_not_found(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        unknown_id = str(uuid4())

        response = client.patch(
            f"/shopping-lists/{unknown_id}",
            json={"name": "Anything"},
            headers=auth_headers,
        )

        assert response.status_code == 404
        assert response.json()["detail"] == "List not found"

    def test_update_shopping_list_rejects_empty_name(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list = shopping_list_factory(name="Valid name")

        response = client.patch(
            f"/shopping-lists/{shopping_list.id}",
            json={"name": "   "},
            headers=auth_headers,
        )

        assert response.status_code == 422
        body = response.json()
        assert body["detail"][0]["msg"] == "Value error, Name cannot be empty"

    def test_update_shopping_list_by_shared_user(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list = shopping_list_factory(user=owner, name="Owner's list")
        shopping_list.shared_with_users.append(current_user)
        db_session.commit()

        payload = {"name": "Hacked name"}
        response = client.patch(
            f"/shopping-lists/{shopping_list.id}", json=payload, headers=auth_headers
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Hacked name"
        db_session.refresh(shopping_list)
        assert shopping_list.name == "Hacked name"

    def test_delete_shopping_list(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list = shopping_list_factory(name="To be deleted")

        response = client.delete(
            f"/shopping-lists/{shopping_list.id}", headers=auth_headers
        )

        assert response.status_code == 204

        deleted = db_session.get(ShoppingList, shopping_list.id)
        assert deleted is None

    def test_delete_shopping_list_404_when_not_found(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
    ) -> None:
        unknown_id = str(uuid4())

        response = client.delete(f"/shopping-lists/{unknown_id}", headers=auth_headers)

        assert response.status_code == 404
        assert response.json()["detail"] == "List not found"

    def test_delete_shopping_list_by_shared_user(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list = shopping_list_factory(user=owner, name="Owner's list")
        shopping_list.shared_with_users.append(current_user)
        db_session.commit()

        response = client.delete(
            f"/shopping-lists/{shopping_list.id}", headers=auth_headers
        )
        assert response.status_code == 404

    # Test cases for shopping list items

    def test_get_shopping_list_empty(
        self,
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
        self,
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

    def test_get_shopping_list_items_returns_for_shared_user(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list = shopping_list_factory(user=owner, name="Shared list")
        shopping_list.shared_with_users.append(current_user)
        db_session.commit()

        shopping_item_factory(
            name="Eggs", quantity=12.0, unit="pc", shopping_list=shopping_list
        )
        shopping_item_factory(
            name="Butter", quantity=200.0, unit="g", shopping_list=shopping_list
        )

        response = client.get(
            f"/shopping-lists/{shopping_list.id}/items", headers=auth_headers
        )

        assert response.status_code == 200
        body = response.json()
        names = {item["name"] for item in body}
        assert names == {"Eggs", "Butter"}

    def test_add_item_creates_new_item(
        self,
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

    def test_add_item_to_shared_list(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list = shopping_list_factory(user=owner, name="Shared list")
        shopping_list.shared_with_users.append(current_user)
        db_session.commit()

        payload = {
            "name": "Flour",
            "quantity": 1000.0,
            "unit": "g",
        }

        response = client.post(
            f"/shopping-lists/{shopping_list.id}/items",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "Flour"

    def test_add_item_merges_same_name_and_unit(
        self,
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
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list = shopping_list_factory()
        item = shopping_item_factory(
            name="Milk",
            quantity=1.0,
            unit="l",
            checked=False,
            shopping_list=shopping_list,
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
        self,
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
        self,
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

    def test_update_item_by_shared_user(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list = shopping_list_factory(user=owner, name="Shared list")
        shopping_list.shared_with_users.append(current_user)
        db_session.commit()
        item = shopping_item_factory(
            name="Old name", quantity=1.0, unit="pc", shopping_list=shopping_list
        )
        payload = {"name": "New name"}

        response = client.patch(
            f"/shopping-lists/{shopping_list.id}/items/{item.id}",
            json=payload,
            headers=auth_headers,
        )

        assert response.status_code == 200
        body = response.json()
        assert body["name"] == "New name"
        db_session.refresh(item)
        assert item.name == "New name"

    def test_update_item_merges_with_existing_duplicate_on_name_change(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list = shopping_list_factory()

        shopping_item_factory(
            name="Milk",
            quantity=1.0,
            unit="l",
            checked=False,
            shopping_list=shopping_list,
        )
        item2 = shopping_item_factory(
            name="Sugar",
            quantity=2.0,
            unit="l",
            checked=True,
            shopping_list=shopping_list,
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
            .filter(
                ShoppingItem.list_id == shopping_list.id, ShoppingItem.name == "Milk"
            )
            .all()
        )
        assert len(items) == 1
        assert items[0].quantity == 3.0

    @pytest.mark.parametrize("invalid_name", ["", " ", "   "])
    def test_update_item_rejects_empty_name(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
        invalid_name: str,
    ) -> None:
        shopping_list = shopping_list_factory()
        item = shopping_item_factory(
            name="Milk",
            quantity=1.0,
            unit="l",
            checked=False,
            shopping_list=shopping_list,
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
        self,
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
        self,
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

    def test_delete_item_by_shared_user(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list = shopping_list_factory(user=owner, name="Shared list")
        shopping_list.shared_with_users.append(current_user)
        db_session.commit()

        item = shopping_item_factory(
            name="To delete", quantity=1.0, unit="pc", shopping_list=shopping_list
        )

        response = client.delete(
            f"/shopping-lists/{shopping_list.id}/items/{item.id}",
            headers=auth_headers,
        )

        assert response.status_code == 204

    def test_clear_list_deletes_all_when_clear_checked_false(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list = shopping_list_factory()

        shopping_item_factory(
            name="Milk",
            quantity=1.0,
            unit="l",
            checked=False,
            shopping_list=shopping_list,
        )
        shopping_item_factory(
            name="Bread",
            quantity=2.0,
            unit="pc",
            checked=True,
            shopping_list=shopping_list,
        )

        response = client.delete(
            f"/shopping-lists/{shopping_list.id}/items",
            headers=auth_headers,
        )
        assert response.status_code == 204

        remaining = (
            db_session.query(ShoppingItem).filter_by(list_id=shopping_list.id).all()
        )
        assert remaining == []

    def test_clear_list_deletes_only_checked_when_clear_checked_true(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        shopping_list = shopping_list_factory()

        unchecked = shopping_item_factory(
            name="Milk",
            quantity=1.0,
            unit="l",
            checked=False,
            shopping_list=shopping_list,
        )
        shopping_item_factory(
            name="Bread",
            quantity=2.0,
            unit="pc",
            checked=True,
            shopping_list=shopping_list,
        )

        response = client.delete(
            f"/shopping-lists/{shopping_list.id}/items?clear_checked=true",
            headers=auth_headers,
        )
        assert response.status_code == 204

        remaining = (
            db_session.query(ShoppingItem).filter_by(list_id=shopping_list.id).all()
        )
        assert len(remaining) == 1
        assert remaining[0].id == unchecked.id
        assert remaining[0].checked is False

    def test_clear_list_by_shared_user(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        owner = user_factory(email="owner@example.com")
        shopping_list = shopping_list_factory(user=owner, name="Shared list")
        shopping_list.shared_with_users.append(current_user)
        db_session.commit()

        shopping_item_factory(
            name="Milk",
            quantity=1.0,
            unit="l",
            checked=False,
            shopping_list=shopping_list,
        )
        shopping_item_factory(
            name="Bread",
            quantity=2.0,
            unit="pc",
            checked=True,
            shopping_list=shopping_list,
        )

        response = client.delete(
            f"/shopping-lists/{shopping_list.id}/items",
            headers=auth_headers,
        )

        assert response.status_code == 204

    def test_add_from_recipe_adds_all_ingredients(
        self,
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
        self,
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
        self,
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

    def test_add_from_recipe_allowed_from_shared_recipe_to_private_list(
        self,
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
            f"/shopping-lists/{list_b.id}/from-recipe/{recipe.id}",
            headers=auth_headers,
        )

        assert res.status_code == 200
        body = res.json()
        assert len(body) == 2
        names = {i["name"] for i in body}
        assert names == {"Flour", "Milk"}

    def test_add_from_recipe_allowed_from_shared_recipe_to_shared_list(
        self,
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
            f"/shopping-lists/{list_ab.id}/from-recipe/{recipe.id}",
            headers=auth_headers,
        )

        assert res.status_code == 200
        body = res.json()
        assert len(body) == 2
        names = {i["name"] for i in body}
        assert names == {"Flour", "Milk"}

    def test_add_from_recipe_forbidden_when_list_has_member_without_recipe_access(
        self,
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
            f"/shopping-lists/{list_bc.id}/from-recipe/{recipe.id}",
            headers=auth_headers,
        )

        assert res.status_code == 403
        detail = res.json().get("detail", "").lower()
        assert "recipe" in detail or "access" in detail
