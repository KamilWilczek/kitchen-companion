import typing as t

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.actions import normalize_key
from app.models.recipe import Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.user import User


class TestSuggestions:
    def test_returns_shopping_item_names(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_item_factory: t.Callable[..., ShoppingItem],
    ) -> None:
        shopping_item_factory(name="marchewka")

        res = client.get("/suggestions/?q=mar", headers=auth_headers)

        assert res.status_code == 200
        assert "marchewka" in res.json()

    def test_returns_ingredient_names(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        recipe_factory: t.Callable[..., Recipe],
    ) -> None:
        recipe_factory(ingredients=[{"name": "marchew", "quantity": 2, "unit": "kg"}])

        res = client.get("/suggestions/?q=mar", headers=auth_headers)

        assert res.status_code == 200
        assert "marchew" in res.json()

    def test_sorted_by_frequency(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_item_factory: t.Callable[..., ShoppingItem],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        lst1 = shopping_list_factory()
        lst2 = shopping_list_factory()
        lst3 = shopping_list_factory()
        shopping_item_factory(name="apricot", shopping_list=lst1)
        shopping_item_factory(name="apricot", shopping_list=lst2)
        shopping_item_factory(name="apricot", shopping_list=lst3)
        shopping_item_factory(name="apple", shopping_list=lst1)

        res = client.get("/suggestions/?q=ap", headers=auth_headers)

        assert res.status_code == 200
        data = res.json()
        assert data[0] == "apricot"

    def test_returns_empty_for_short_query(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        shopping_item_factory: t.Callable[..., ShoppingItem],
    ) -> None:
        shopping_item_factory(name="marchewka")

        res = client.get("/suggestions/?q=m", headers=auth_headers)

        assert res.status_code == 200
        assert res.json() == []

    def test_no_cross_user_leakage(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
        recipe_factory: t.Callable[..., Recipe],
    ) -> None:
        other = user_factory()

        other_list = ShoppingList(user_id=other.id, name="other list")
        db_session.add(other_list)
        db_session.flush()

        name_norm, unit_norm = normalize_key("secretitem", "kg")
        db_session.add(
            ShoppingItem(
                user_id=other.id,
                list_id=other_list.id,
                name="secretitem",
                quantity=1.0,
                unit="kg",
                name_norm=name_norm,
                unit_norm=unit_norm,
            )
        )

        recipe_factory(
            user=other,
            ingredients=[{"name": "secretingredient", "quantity": 1, "unit": "g"}],
        )
        db_session.flush()

        res = client.get("/suggestions/?q=se", headers=auth_headers)

        assert res.status_code == 200
        assert "secretitem" not in res.json()
        assert "secretingredient" not in res.json()
