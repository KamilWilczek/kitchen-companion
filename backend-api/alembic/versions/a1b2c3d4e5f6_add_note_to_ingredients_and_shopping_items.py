"""add note to ingredients and shopping_items

Revision ID: a1b2c3d4e5f6
Revises: 9170391de171
Create Date: 2026-04-16 00:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '9170391de171'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('ingredients', sa.Column('note', sa.String(), nullable=True))
    op.add_column('shopping_items', sa.Column('note', sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column('shopping_items', 'note')
    op.drop_column('ingredients', 'note')
