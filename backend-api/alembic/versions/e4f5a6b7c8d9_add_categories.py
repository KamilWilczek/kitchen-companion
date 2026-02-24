"""add_categories

Revision ID: e4f5a6b7c8d9
Revises: 24d3c4e61a3b
Create Date: 2026-02-24 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "e4f5a6b7c8d9"
down_revision: Union[str, Sequence[str], None] = "24d3c4e61a3b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

convention = {
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
}


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=True,
            index=True,
        ),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("icon", sa.String(), nullable=True),
        sa.UniqueConstraint("user_id", "name", name="uq_category_user_name"),
    )

    with op.batch_alter_table("ingredients", naming_convention=convention) as batch_op:
        batch_op.add_column(
            sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_ingredients_category_id_categories",
            "categories",
            ["category_id"],
            ["id"],
            ondelete="SET NULL",
        )

    with op.batch_alter_table("shopping_items", naming_convention=convention) as batch_op:
        batch_op.add_column(
            sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True)
        )
        batch_op.create_foreign_key(
            "fk_shopping_items_category_id_categories",
            "categories",
            ["category_id"],
            ["id"],
            ondelete="SET NULL",
        )


def downgrade() -> None:
    with op.batch_alter_table("shopping_items", naming_convention=convention) as batch_op:
        batch_op.drop_constraint(
            "fk_shopping_items_category_id_categories", type_="foreignkey"
        )
        batch_op.drop_column("category_id")

    with op.batch_alter_table("ingredients", naming_convention=convention) as batch_op:
        batch_op.drop_constraint(
            "fk_ingredients_category_id_categories", type_="foreignkey"
        )
        batch_op.drop_column("category_id")

    op.drop_table("categories")
