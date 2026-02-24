import typing as t

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.recipe import Ingredient, Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.user import User


def _system_category(db: Session) -> Category:
    category = db.query(Category).filter(Category.user_id.is_(None)).first()
    assert category is not None
    return category


def _category_factory(db: Session, user: User, name: str = "my_cat", icon: str | None = "🍎") -> Category:
    cat = Category(user_id=user.id, name=name, icon=icon)
    db.add(cat)
    db.flush()
    db.refresh(cat)
    return cat


class TestGetCategories:
    def test_returns_system_and_own_categories(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        _category_factory(db_session, current_user, name="custom")

        res = client.get("/categories/", headers=auth_headers)

        assert res.status_code == 200
        names = {c["name"] for c in res.json()}
        assert "custom" in names
        assert "mięso" in names  # system category

    def test_does_not_return_other_users_categories(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
    ) -> None:
        other = user_factory()
        _category_factory(db_session, other, name="secret_category")

        res = client.get("/categories/", headers=auth_headers)

        names = {c["name"] for c in res.json()}
        assert "secret_category" not in names

    def test_system_categories_have_is_system_true(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        res = client.get("/categories/", headers=auth_headers)
        system = [c for c in res.json() if c["name"] == "mięso"]
        assert len(system) == 1
        assert system[0]["is_system"] is True

    def test_user_categories_have_is_system_false(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        _category_factory(db_session, current_user, name="custom")

        res = client.get("/categories/", headers=auth_headers)
        user_cats = [c for c in res.json() if c["name"] == "custom"]
        assert user_cats[0]["is_system"] is False


class TestCreateCategory:
    def test_create_category(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        res = client.post(
            "/categories/",
            json={"name": "superfoods", "icon": "🥗"},
            headers=auth_headers,
        )

        assert res.status_code == 201
        body = res.json()
        assert body["name"] == "superfoods"
        assert body["icon"] == "🥗"
        assert body["is_system"] is False

    def test_duplicate_name_rejected(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        client.post("/categories/", json={"name": "dupe"}, headers=auth_headers)
        res = client.post("/categories/", json={"name": "dupe"}, headers=auth_headers)

        assert res.status_code == 400

    def test_same_name_as_system_category_allowed(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        # user can create a category with the same name as a system category
        res = client.post(
            "/categories/", json={"name": "vegetables_fruit"}, headers=auth_headers
        )
        assert res.status_code == 201


class TestUpdateCategory:
    def test_rename_own_category(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        cat = _category_factory(db_session, current_user, name="old_name")

        res = client.put(
            f"/categories/{cat.id}",
            json={"name": "new_name", "icon": "🍊"},
            headers=auth_headers,
        )

        assert res.status_code == 200
        assert res.json()["name"] == "new_name"

    def test_cannot_rename_system_category(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        sys_cat = _system_category(db_session)

        res = client.put(
            f"/categories/{sys_cat.id}",
            json={"name": "hacked"},
            headers=auth_headers,
        )

        assert res.status_code == 404

    def test_rename_to_duplicate_rejected(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        _category_factory(db_session, current_user, name="existing")
        cat = _category_factory(db_session, current_user, name="to_rename")

        res = client.put(
            f"/categories/{cat.id}",
            json={"name": "existing"},
            headers=auth_headers,
        )

        assert res.status_code == 400


class TestDeleteCategory:
    def test_delete_own_category(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        cat = _category_factory(db_session, current_user)

        res = client.delete(f"/categories/{cat.id}", headers=auth_headers)

        assert res.status_code == 204

    def test_cannot_delete_system_category(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        sys_cat = _system_category(db_session)

        res = client.delete(f"/categories/{sys_cat.id}", headers=auth_headers)

        assert res.status_code == 403

    def test_cannot_delete_other_users_category(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        user_factory: t.Callable[..., User],
    ) -> None:
        other = user_factory()
        cat = _category_factory(db_session, other, name="theirs")

        res = client.delete(f"/categories/{cat.id}", headers=auth_headers)

        assert res.status_code == 404


class TestCategoryPropagation:
    def test_category_propagates_from_ingredient_to_shopping_item(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        recipe_factory: t.Callable[..., Recipe],
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        current_user = db_session.query(User).filter_by(email="test@example.com").one()
        sys_cat = _system_category(db_session)

        recipe = recipe_factory(
            ingredients=[{"name": "Carrot", "quantity": 3, "unit": "szt."}]
        )
        # assign category directly on the DB ingredient
        ingredient = recipe.ingredients[0]
        ingredient.category_id = sys_cat.id
        db_session.commit()

        lst = shopping_list_factory()
        res = client.post(
            f"/recipes/{lst.id}/from-recipe/{recipe.id}", headers=auth_headers
        )
        assert res.status_code == 200

        item = db_session.query(ShoppingItem).filter_by(list_id=lst.id).one()
        assert item.category_id == sys_cat.id

    def test_add_item_with_category(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
    ) -> None:
        sys_cat = _system_category(db_session)
        lst = shopping_list_factory()

        res = client.post(
            f"/shopping-lists/{lst.id}/items",
            json={"name": "Milk", "quantity": 1, "unit": "l", "category_id": str(sys_cat.id)},
            headers=auth_headers,
        )

        assert res.status_code == 200
        assert res.json()["category"]["name"] == sys_cat.name

    def test_add_item_with_invalid_category_rejected(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
        user_factory: t.Callable[..., User],
    ) -> None:
        other = user_factory()
        other_cat = _category_factory(db_session, other, name="theirs")
        lst = shopping_list_factory()

        res = client.post(
            f"/shopping-lists/{lst.id}/items",
            json={"name": "Milk", "quantity": 1, "unit": "l", "category_id": str(other_cat.id)},
            headers=auth_headers,
        )

        assert res.status_code == 400
