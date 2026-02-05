"""add_plan_to_users

Revision ID: 83864b203b5f
Revises: 0389bf4b4c76
Create Date: 2026-02-05 09:41:12.352511

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '83864b203b5f'
down_revision: Union[str, Sequence[str], None] = '0389bf4b4c76'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('plan', sa.String(), server_default='free', nullable=False))


def downgrade() -> None:
    op.drop_column('users', 'plan')
