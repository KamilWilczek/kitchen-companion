from sqlalchemy import UniqueConstraint, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from app.models.base import Base, uuid_str


class ShoppingItem(Base):
    __tablename__ = "shopping_items"
    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str]
    unit: Mapped[str]
    quantity: Mapped[float]
    checked: Mapped[bool] = mapped_column(default=False)
    recipe_id: Mapped[str | None] = mapped_column(ForeignKey("recipes.id"), default=None)

    name_norm: Mapped[str]
    unit_norm: Mapped[str]
    __table_args__ = (UniqueConstraint("user_id", "name_norm", "unit_norm", name="uq_shopping_norm"),)