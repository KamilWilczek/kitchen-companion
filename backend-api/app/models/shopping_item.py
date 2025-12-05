from uuid import UUID, uuid4

from app.models.base import Base
from sqlalchemy import (
    CheckConstraint,
    ForeignKey,
    Index,
    UniqueConstraint,
    case,
    func,
    select,
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, column_property, mapped_column, relationship
from sqlalchemy.schema import Column, Table

shopping_list_shares = Table(
    "shopping_list_shares",
    Base.metadata,
    Column(
        "list_id",
        PG_UUID(as_uuid=True),
        ForeignKey("shopping_lists.id"),
        primary_key=True,
    ),
    Column("user_id", PG_UUID(as_uuid=True), ForeignKey("users.id"), primary_key=True),
    UniqueConstraint("list_id", "user_id", name="uq_shopping_list_share"),
)


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
    unit: Mapped[str | None] = mapped_column(nullable=True, default=None)
    quantity: Mapped[float]
    checked: Mapped[bool] = mapped_column(default=False)
    recipe_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("recipes.id"), default=None
    )

    name_norm: Mapped[str]
    unit_norm: Mapped[str]

    shopping_list = relationship("ShoppingList", back_populates="items")

    __table_args__ = (
        UniqueConstraint("list_id", "name_norm", "unit_norm", name="uq_shopping_norm"),
        Index("ix_shopping_items_list_id", "list_id"),
        CheckConstraint(
            "unit IN ('l', 'kg', 'ml', 'g', 'szt.', 'op.') OR unit IS NULL",
            name="ck_shopping_items_unit_allowed",
        ),
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
        "ShoppingItem", back_populates="shopping_list", cascade="all, delete-orphan"
    )
    shared_with_users = relationship(
        "User",
        secondary=shopping_list_shares,
        back_populates="shopping_lists_shared_with_me",
    )

    total_items: Mapped[int] = column_property(
        select(func.count(ShoppingItem.id))
        .where(ShoppingItem.list_id == id)
        .scalar_subquery()
    )

    checked_items: Mapped[int] = column_property(
        select(func.coalesce(func.sum(case((ShoppingItem.checked, 1), else_=0)), 0))
        .where(ShoppingItem.list_id == id)
        .scalar_subquery()
    )
