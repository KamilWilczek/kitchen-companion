"""seed_system_categories

Revision ID: f5a6b7c8d9e4
Revises: e4f5a6b7c8d9
Create Date: 2026-02-23 12:01:00.000000

"""
from typing import Sequence, Union
from uuid import uuid4

from alembic import op
import sqlalchemy as sa

revision: str = "f5a6b7c8d9e4"
down_revision: Union[str, Sequence[str], None] = "e4f5a6b7c8d9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SYSTEM_CATEGORIES = [
    ("alkohol", "🍷"),
    ("art. sypkie", "🌾"),
    ("bakalie i orzechy", "🥜"),
    ("dania gotowe", "🍱"),
    ("dom i ogród", "🏡"),
    ("dziecko", "👶"),
    ("elektronika", "🔌"),
    ("higiena", "🧼"),
    ("inne", "📦"),
    ("kawa i herbata", "☕"),
    ("konserwy i przetwory", "🥫"),
    ("medyczne", "💊"),
    ("mięso", "🥩"),
    ("nabiał", "🥛"),
    ("mrożonki", "🧊"),
    ("oleje i tłuszcze", "🫒"),
    ("owoce i warzywa", "🍎"),
    ("pieczenie i dodatki", "🧁"),
    ("pieczywo", "🍞"),
    ("przyprawy", "🧂"),
    ("ryby i owoce morza", "🐟"),
    ("słodycze i przekąski", "🍬"),
    ("środki czystości", "🫧"),
    ("świeże zioła", "🌿"),
    ("wege", "🥗"),
    ("woda i napoje", "💧"),
    ("zwierzęta", "🐾"),
]


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
        [
            {"id": uuid4().hex, "user_id": None, "name": name, "icon": icon}
            for name, icon in SYSTEM_CATEGORIES
        ],
    )


def downgrade() -> None:
    op.execute("DELETE FROM categories WHERE user_id IS NULL")
