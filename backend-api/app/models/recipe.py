from sqlalchemy import ForeignKey, Table, Column, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, uuid_str


recipe_tag = Table(
    "recipe_tags",
    Base.metadata,
    Column("recipe_id", String, ForeignKey("recipes.id"), primary_key=True),
    Column("tag_id", String, ForeignKey("tags.id"), primary_key=True),
)


class Ingredient(Base):
    __tablename__ = "ingredients"
    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    recipe_id: Mapped[str] = mapped_column(ForeignKey("recipes.id"))
    name: Mapped[str]
    quantity: Mapped[float]
    unit: Mapped[str]
    recipe = relationship("Recipe", back_populates="ingredients")


class Recipe(Base):
    __tablename__ = "recipes"
    id: Mapped[str] = mapped_column(primary_key=True, default=uuid_str)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    description: Mapped[str] = mapped_column(default="")
    source: Mapped[str | None]

    ingredients = relationship(
        "Ingredient", cascade="all, delete-orphan", back_populates="recipe"
    )
    tags = relationship("Tag", secondary=recipe_tag)
