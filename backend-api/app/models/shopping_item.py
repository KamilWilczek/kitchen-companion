from uuid import UUID, uuid4

from app.models.base import Base
from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class ShoppingItem(Base):
    __tablename__ = "shopping_items"
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    list_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("shopping_lists.id"), index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    name: Mapped[str]
    unit: Mapped[str]
    quantity: Mapped[float]
    checked: Mapped[bool] = mapped_column(default=False)
    recipe_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("recipes.id"), default=None
    )

    name_norm: Mapped[str]
    unit_norm: Mapped[str]

    list = relationship("ShoppingList", back_populates="items")

    __table_args__ = (
        UniqueConstraint("list_id", "name_norm", "unit_norm", name="uq_shopping_norm"),
        Index("ix_shopping_items_list_id", "list_id"),
    )


class ShoppingList(Base):
    __tablename__ = "shopping_lists"
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )
    name: Mapped[str]
    description: Mapped[str | None] = mapped_column(default=None)
    items = relationship(
        "ShoppingItem", back_populates="list", cascade="all, delete-orphan"
    )
