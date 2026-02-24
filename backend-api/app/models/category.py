from uuid import UUID, uuid4

from app.models.base import Base
from sqlalchemy import String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID | None] = mapped_column(
        PG_UUID(as_uuid=True), nullable=True, default=None, index=True
    )
    name: Mapped[str] = mapped_column(String, nullable=False)
    icon: Mapped[str | None] = mapped_column(String, nullable=True, default=None)

    ingredients = relationship("Ingredient", back_populates="category")
    shopping_items = relationship("ShoppingItem", back_populates="category")

    @property
    def is_system(self) -> bool:
        return self.user_id is None

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_category_user_name"),
    )
