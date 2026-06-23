from datetime import date
from uuid import UUID, uuid4

from app.models.base import Base
from sqlalchemy import Date, ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship


class MealPlanEntry(Base):
    __tablename__ = "meal_plan_entries"

    id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    meal_slot: Mapped[str] = mapped_column(String, nullable=False)  # breakfast|lunch|dinner|supper
    recipe_id: Mapped[UUID] = mapped_column(PG_UUID(as_uuid=True), ForeignKey("recipes.id", ondelete="CASCADE"))

    recipe = relationship("Recipe", lazy="joined")

    __table_args__ = (
        UniqueConstraint("user_id", "date", "meal_slot", name="uq_meal_plan_user_date_slot"),
    )
