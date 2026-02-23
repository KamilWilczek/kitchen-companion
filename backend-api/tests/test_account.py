import typing as t

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recipe import Recipe
from app.models.shopping_item import ShoppingList
from app.models.user import User


class TestGetMe:
    def test_returns_profile(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        res = client.get("/account/me", headers=auth_headers)

        assert res.status_code == 200
        body = res.json()
        assert body["email"] == "test@example.com"
        assert "id" in body
        assert "plan" in body

    def test_unauthenticated(self, client: TestClient) -> None:
        res = client.get("/account/me")

        assert res.status_code == 401


class TestChangePassword:
    def test_success_old_password_invalid_new_works(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        res = client.put(
            "/account/password",
            json={"current_password": "secret123", "new_password": "newpass456"},
            headers=auth_headers,
        )
        assert res.status_code == 204

        old_login = client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "secret123"},
        )
        assert old_login.status_code == 401

        new_login = client.post(
            "/auth/login",
            json={"email": "test@example.com", "password": "newpass456"},
        )
        assert new_login.status_code == 200

    def test_wrong_current_password(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        res = client.put(
            "/account/password",
            json={"current_password": "wrongpassword", "new_password": "newpass456"},
            headers=auth_headers,
        )

        assert res.status_code == 400

    def test_unauthenticated(self, client: TestClient) -> None:
        res = client.put(
            "/account/password",
            json={"current_password": "secret123", "new_password": "newpass456"},
        )

        assert res.status_code == 401


class TestUpdatePlan:
    def test_returns_new_tokens(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        res = client.put(
            "/account/plan", json={"plan": "premium"}, headers=auth_headers
        )

        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body
        assert "refresh_token" in body

    def test_plan_persisted_in_db(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        client.put("/account/plan", json={"plan": "premium"}, headers=auth_headers)

        db_session.expire_all()
        user = db_session.query(User).filter_by(email="test@example.com").one()
        assert user.plan == "premium"

    def test_downgrade_back_to_free(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        client.put("/account/plan", json={"plan": "premium"}, headers=auth_headers)
        client.put("/account/plan", json={"plan": "free"}, headers=auth_headers)

        db_session.expire_all()
        user = db_session.query(User).filter_by(email="test@example.com").one()
        assert user.plan == "free"


class TestDeleteAccount:
    def test_user_removed_from_db(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        res = client.delete("/account/me", headers=auth_headers)

        assert res.status_code == 204
        user = db_session.query(User).filter_by(email="test@example.com").first()
        assert user is None

    def test_cascades_owned_data(
        self,
        client: TestClient,
        auth_headers: dict[str, str],
        db_session: Session,
        shopping_list_factory: t.Callable[..., ShoppingList],
        recipe_factory: t.Callable[..., Recipe],
    ) -> None:
        lst = shopping_list_factory()
        recipe = recipe_factory()
        lst_id = lst.id
        recipe_id = recipe.id

        client.delete("/account/me", headers=auth_headers)

        assert db_session.scalar(select(ShoppingList).where(ShoppingList.id == lst_id)) is None
        assert db_session.scalar(select(Recipe).where(Recipe.id == recipe_id)) is None

    def test_unauthenticated(self, client: TestClient) -> None:
        res = client.delete("/account/me")

        assert res.status_code == 401


class TestPremiumCheck:
    def test_free_user_gets_403(
        self, client: TestClient, auth_headers: dict[str, str]
    ) -> None:
        res = client.get("/account/premium-check", headers=auth_headers)

        assert res.status_code == 403

    def test_premium_user_passes(
        self, client: TestClient, auth_headers: dict[str, str], db_session: Session
    ) -> None:
        user = db_session.query(User).filter_by(email="test@example.com").one()
        user.plan = "premium"
        db_session.commit()

        res = client.get("/account/premium-check", headers=auth_headers)

        assert res.status_code == 200
