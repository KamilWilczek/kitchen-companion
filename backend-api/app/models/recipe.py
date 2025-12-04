from uuid import UUID, uuid4

from app.models.base import Base
from sqlalchemy import Column, ForeignKey, Index, Table
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

recipe_tag = Table(
    "recipe_tags",
    Base.metadata,
    Column(
        "recipe_id", PG_UUID(as_uuid=True), ForeignKey("recipes.id"), primary_key=True
    ),
    Column("tag_id", PG_UUID(as_uuid=True), ForeignKey("tags.id"), primary_key=True),
)

recipe_shares = Table(
    "recipe_shares",
    Base.metadata,
    Column(
        "recipe_id", PG_UUID(as_uuid=True), ForeignKey("recipes.id"), primary_key=True
    ),
    Column(
        "user_id",
        PG_UUID(as_uuid=True),
        ForeignKey("users.id"),
        primary_key=True,
    ),
)


class Ingredient(Base):
    __tablename__ = "ingredients"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    recipe_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("recipes.id")
    )

    name: Mapped[str]
    quantity: Mapped[float]
    unit: Mapped[str]

    recipe = relationship("Recipe", back_populates="ingredients")


class Recipe(Base):
    __tablename__ = "recipes"

    id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), primary_key=True, default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("users.id"), index=True
    )

    title: Mapped[str]
    description: Mapped[str] = mapped_column(default="")
    source: Mapped[str | None]

    ingredients = relationship(
        "Ingredient", cascade="all, delete-orphan", back_populates="recipe"
    )
    tags = relationship("Tag", secondary=recipe_tag, back_populates="recipes")
    shared_with_users = relationship(
        "User",
        secondary=recipe_shares,
        back_populates="recipes_shared_with_me",
    )

    __table_args__ = (Index("ix_recipes_user_id", "user_id"),)
