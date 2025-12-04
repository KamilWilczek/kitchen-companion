from uuid import UUID, uuid4

from app.models.base import Base
from app.models.recipe import recipe_shares
from app.models.shopping_item import shopping_list_shares
from sqlalchemy import String
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class User(Base):
    __tablename__ = "users"
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    external_id: Mapped[str | None] = mapped_column(String, unique=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String)
    recipes_shared_with_me = relationship(
        "Recipe",
        secondary=recipe_shares,
        back_populates="shared_with_users",
    )
    shopping_lists_shared_with_me = relationship(
        "ShoppingList",
        secondary=shopping_list_shares,
        back_populates="shared_with_users",
    )
