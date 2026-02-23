import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User


class TestRegister:
    def test_register_success(self, client: TestClient, db_session: Session) -> None:
        res = client.post(
            "/auth/register",
            json={"email": "new@example.com", "password": "password123"},
        )

        assert res.status_code == 201
        body = res.json()
        assert body["email"] == "new@example.com"
        assert "id" in body

        user = db_session.query(User).filter_by(email="new@example.com").first()
        assert user is not None

    def test_register_duplicate_email(self, client: TestClient) -> None:
        payload = {"email": "dupe@example.com", "password": "password123"}
        client.post("/auth/register", json=payload)

        res = client.post("/auth/register", json=payload)

        assert res.status_code == 400
        assert "already exists" in res.json()["detail"]


class TestLogin:
    def test_login_success_returns_tokens(self, client: TestClient) -> None:
        client.post(
            "/auth/register",
            json={"email": "user@example.com", "password": "password123"},
        )

        res = client.post(
            "/auth/login",
            json={"email": "user@example.com", "password": "password123"},
        )

        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body
        assert "refresh_token" in body

    def test_login_wrong_password(self, client: TestClient) -> None:
        client.post(
            "/auth/register",
            json={"email": "user@example.com", "password": "password123"},
        )

        res = client.post(
            "/auth/login",
            json={"email": "user@example.com", "password": "wrongpassword"},
        )

        assert res.status_code == 401

    def test_login_unknown_email(self, client: TestClient) -> None:
        res = client.post(
            "/auth/login",
            json={"email": "nobody@example.com", "password": "password123"},
        )

        assert res.status_code == 401


class TestRefresh:
    def _get_tokens(self, client: TestClient) -> dict:
        client.post(
            "/auth/register",
            json={"email": "user@example.com", "password": "password123"},
        )
        res = client.post(
            "/auth/login",
            json={"email": "user@example.com", "password": "password123"},
        )
        return res.json()

    def test_refresh_returns_new_tokens(self, client: TestClient) -> None:
        tokens = self._get_tokens(client)

        res = client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )

        assert res.status_code == 200
        body = res.json()
        assert "access_token" in body
        assert "refresh_token" in body

    def test_refresh_rejects_access_token(self, client: TestClient) -> None:
        tokens = self._get_tokens(client)

        res = client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["access_token"]},
        )

        assert res.status_code == 401

    def test_refresh_rejects_invalid_token(self, client: TestClient) -> None:
        res = client.post(
            "/auth/refresh",
            json={"refresh_token": "not.a.valid.token"},
        )

        assert res.status_code == 401

    def test_refresh_rejects_deleted_user(
        self, client: TestClient, db_session: Session
    ) -> None:
        tokens = self._get_tokens(client)

        user = db_session.query(User).filter_by(email="user@example.com").one()
        db_session.delete(user)
        db_session.commit()

        res = client.post(
            "/auth/refresh",
            json={"refresh_token": tokens["refresh_token"]},
        )

        assert res.status_code == 401
