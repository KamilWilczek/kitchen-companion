from uuid import UUID, uuid4

from app.models.base import Base
from sqlalchemy import ForeignKey, Index, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column


class ShoppingItem(Base):
    __tablename__ = "shopping_items"
    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
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
    __table_args__ = (
        UniqueConstraint("user_id", "name_norm", "unit_norm", name="uq_shopping_norm"),
        Index("ix_shopping_items_user_id", "user_id"),
    )
