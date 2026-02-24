import os
import typing as t
import uuid
from uuid import UUID

import main
import pytest
from alembic import command
from alembic.config import Config
from app.actions import normalize_key
from app.core.db import get_db
from app.core.predefined_categories import seed_predefined_categories
from app.models.category import Category  # noqa: F401 — ensures table is known to metadata
from app.models.recipe import Ingredient, Recipe
from app.models.shopping_item import ShoppingItem, ShoppingList
from app.models.tag import Tag
from app.models.user import User
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker

# Use an isolated DB file for migration support
TEST_DB_URL = "sqlite:///./test.db"

app = main.app


@pytest.fixture(scope="session", autouse=True)
def apply_migrations():
    """Run Alembic migrations once on the test DB."""
    if os.path.exists("test.db"):
        try:
            os.remove("test.db")
        except PermissionError:
            # If locked, reuse existing file
            pass

    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", TEST_DB_URL)
    command.upgrade(alembic_cfg, "head")

    # Seed predefined categories into the test DB
    from sqlalchemy.orm import sessionmaker
    _Session = sessionmaker(bind=engine)
    db = _Session()
    try:
        seed_predefined_categories(db)
    finally:
        db.close()

    yield  # no teardown: avoid WinError 32


# Global engine; schema is created by Alembic
engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def set_sqlite_fk_pragma(dbapi_connection, _connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

# Session factory, bound per-test via connection
SessionLocal = sessionmaker(autocommit=False, autoflush=False)


@pytest.fixture()
def db_session():
    """
    Provide a DB session wrapped in a transaction.

    Each test gets its own connection + transaction.
    All commits inside the test are rolled back at the end,
    so DB state does NOT leak between tests.
    """
    connection = engine.connect()
    transaction = connection.begin()
    session = SessionLocal(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    """FastAPI TestClient with get_db overridden to use the test session."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app = main.app
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)


@pytest.fixture()
def auth_headers(client):
    """
    Create a fresh user and log in for each test.
    Because db_session is transactional and rolled back,
    every test starts from a clean DB.
    """
    email = "test@example.com"
    password = "secret123"

    # Register
    res = client.post(
        "/auth/register",
        json={"email": email, "password": password},
    )
    assert res.status_code == 201, res.text

    # Login
    res = client.post(
        "/auth/login",
        json={"email": email, "password": password},
    )
    assert res.status_code == 200, res.text

    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def tag_factory(
    db_session: Session,
    auth_headers: dict[str, str],
) -> t.Callable[..., list[Tag]]:
    """
    Create one or many Tag rows directly in the DB, for the logged in user.

    Usage:
        tag = tag_factory("fruit")[0]
        t1, t2 = tag_factory("fruit", "veg")
        t1, t2 = tag_factory("fruit", "veg", user_id=some_other_user_id)
    """

    def _factory(*names: str, user_id: UUID | None = None) -> list[Tag]:
        # If no user_id supplied, use the default test user created in auth_headers
        if user_id is None:
            # Must match the email used in auth_headers
            user = db_session.query(User).filter_by(email="test@example.com").one()
            user_id_local = user.id
        else:
            user_id_local = user_id

        tags = [Tag(user_id=user_id_local, name=name) for name in names]
        db_session.add_all(tags)
        db_session.flush()  # flush is enough; commit also fine inside outer transaction

        for tag in tags:
            db_session.refresh(tag)
        return tags

    return _factory


@pytest.fixture
def recipe_factory(
    db_session: Session,
    auth_headers: dict[str, str],
) -> t.Callable[..., Recipe]:
    """
    Create a Recipe for some user (default: logged-in test user),
    optionally with ingredients and tags.

    Usage:
        recipe = recipe_factory()
        recipe = recipe_factory(user=some_user)
        recipe = recipe_factory(
            user_id=some_user.id,
            title="Pancakes",
            ingredients=[{"name": "Flour", "quantity": 200, "unit": "g"}],
            tags=[tag1, tag2],
        )
    """

    def _factory(
        *,
        title: str = "Test recipe",
        description: str = "",
        source: str | None = None,
        ingredients: t.Sequence[dict] | None = None,
        tags: t.Sequence[Tag] | None = None,
        user: User | None = None,
        user_id: UUID | None = None,
    ) -> Recipe:
        if user is not None and user_id is not None:
            raise ValueError("Pass either user or user_id, not both")

        if user is None and user_id is None:
            # default: current logged-in user
            user = db_session.query(User).filter_by(email="test@example.com").one()
            user_id_local = user.id
        elif user is not None:
            user_id_local = user.id
        else:
            user_id_local = user_id  # type: ignore[assignment]

        recipe = Recipe(
            user_id=user_id_local,
            title=title,
            description=description,
            source=source,
        )

        if ingredients:
            recipe.ingredients = [
                Ingredient(
                    name=ing["name"],
                    quantity=ing["quantity"],
                    unit=ing["unit"],
                )
                for ing in ingredients
            ]

        if tags:
            recipe.tags = list(tags)

        db_session.add(recipe)
        db_session.flush()
        db_session.refresh(recipe)
        return recipe

    return _factory


@pytest.fixture
def shopping_item_factory(
    db_session: Session,
    auth_headers: dict[str, str],
    shopping_list_factory: t.Callable[..., ShoppingList],
) -> t.Callable[..., ShoppingItem]:
    """
    Create a ShoppingItem for the logged-in test user, in a given list.

    Usage:
        item = shopping_item_factory()
        item = shopping_item_factory(name="Milk", quantity=2.0, unit="l", checked=True)
        item = shopping_item_factory(shopping_list=my_list)
    """

    def _factory(
        *,
        name: str = "Milk",
        quantity: float = 1.0,
        unit: str = "l",
        checked: bool = False,
        recipe_id: UUID | None = None,
        shopping_list: ShoppingList | None = None,
    ) -> ShoppingItem:
        user: User = db_session.query(User).filter_by(email="test@example.com").one()

        if shopping_list is None:
            shopping_list = shopping_list_factory()

        name_clean = name.strip()
        unit_clean = unit.strip()

        name_norm, unit_norm = normalize_key(name_clean, unit_clean)

        item = ShoppingItem(
            user_id=user.id,
            list_id=shopping_list.id,
            name=name_clean,
            unit=unit_clean,
            quantity=quantity,
            checked=checked,
            recipe_id=recipe_id,
            name_norm=name_norm,
            unit_norm=unit_norm,
        )
        db_session.add(item)
        db_session.flush()
        db_session.refresh(item)
        return item

    return _factory


@pytest.fixture
def shopping_list_factory(
    db_session: Session,
    auth_headers: dict[str, str],
) -> t.Callable[..., ShoppingList]:
    """
    Create a ShoppingList for a given user (default: logged-in test user).

    Usage:
        lst = shopping_list_factory()
        lst = shopping_list_factory(name="BBQ")
        lst = shopping_list_factory(user=some_user)
        lst = shopping_list_factory(user_id=some_user.id)
    """

    def _factory(
        *,
        name: str = "My list",
        description: str | None = None,
        user: User | None = None,
        user_id: UUID | None = None,
    ) -> ShoppingList:
        if user is not None and user_id is not None:
            raise ValueError("Pass either user or user_id, not both")

        if user is None and user_id is None:
            user = db_session.query(User).filter_by(email="test@example.com").one()
            user_id_local = user.id
        elif user is not None:
            user_id_local = user.id
        else:
            user_id_local = user_id  # type: ignore[assignment]

        lst = ShoppingList(
            user_id=user_id_local,
            name=name,
            description=description,
        )
        db_session.add(lst)
        db_session.flush()
        db_session.refresh(lst)
        return lst

    return _factory


@pytest.fixture
def user_factory(db_session: Session) -> t.Callable[..., User]:
    """
    Create arbitrary users for tests (A, B, C, ...).

    Usage:
        user = user_factory(email="a@example.com")
        user = user_factory()  # random email
    """

    def _factory(
        *,
        email: str | None = None,
        password_hash: str = "x",
    ) -> User:
        if email is None:
            email = f"user-{uuid.uuid4()}@example.com"

        user = User(email=email, password_hash=password_hash)
        db_session.add(user)
        db_session.flush()
        db_session.refresh(user)
        return user

    return _factory
