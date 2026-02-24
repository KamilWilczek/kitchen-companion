"""add_nabial_category

Revision ID: a1b2c3d4e5f6
Revises: f5a6b7c8d9e4
Create Date: 2026-02-24 12:25:57.809640

"""
from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "f5a6b7c8d9e4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    categories_table = sa.table(
        "categories",
        sa.column("id", sa.String),
        sa.column("user_id", sa.String),
        sa.column("name", sa.String),
        sa.column("icon", sa.String),
    )
    op.bulk_insert(
        categories_table,
        [{"id": uuid4().hex, "user_id": None, "name": "nabiał", "icon": "🥛"}],
    )


def downgrade() -> None:
    op.execute("DELETE FROM categories WHERE user_id IS NULL AND name = 'nabiał'")
