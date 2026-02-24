"""add_cascade_deletes

Revision ID: 24d3c4e61a3b
Revises: 83864b203b5f
Create Date: 2026-02-23 10:38:05.058437

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '24d3c4e61a3b'
down_revision: Union[str, Sequence[str], None] = '83864b203b5f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add ON DELETE CASCADE / SET NULL to all foreign keys.

    The init migration created FKs without explicit names, so Postgres
    auto-generated them as <table>_<column>_fkey. We drop those and recreate
    with explicit fk_* names and the desired ON DELETE behaviour.
    """

    # --- ingredients ---
    op.drop_constraint('ingredients_recipe_id_fkey', 'ingredients', type_='foreignkey')
    op.create_foreign_key(
        'fk_ingredients_recipe_id_recipes', 'ingredients', 'recipes',
        ['recipe_id'], ['id'], ondelete='CASCADE',
    )

    # --- recipe_shares ---
    op.drop_constraint('recipe_shares_recipe_id_fkey', 'recipe_shares', type_='foreignkey')
    op.drop_constraint('recipe_shares_user_id_fkey', 'recipe_shares', type_='foreignkey')
    op.create_foreign_key(
        'fk_recipe_shares_recipe_id_recipes', 'recipe_shares', 'recipes',
        ['recipe_id'], ['id'], ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_recipe_shares_user_id_users', 'recipe_shares', 'users',
        ['user_id'], ['id'], ondelete='CASCADE',
    )

    # --- recipe_tags ---
    op.drop_constraint('recipe_tags_recipe_id_fkey', 'recipe_tags', type_='foreignkey')
    op.drop_constraint('recipe_tags_tag_id_fkey', 'recipe_tags', type_='foreignkey')
    op.create_foreign_key(
        'fk_recipe_tags_recipe_id_recipes', 'recipe_tags', 'recipes',
        ['recipe_id'], ['id'], ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_recipe_tags_tag_id_tags', 'recipe_tags', 'tags',
        ['tag_id'], ['id'], ondelete='CASCADE',
    )

    # --- recipes ---
    op.drop_constraint('recipes_user_id_fkey', 'recipes', type_='foreignkey')
    op.create_foreign_key(
        'fk_recipes_user_id_users', 'recipes', 'users',
        ['user_id'], ['id'], ondelete='CASCADE',
    )

    # --- shopping_items ---
    op.drop_constraint('shopping_items_list_id_fkey', 'shopping_items', type_='foreignkey')
    op.drop_constraint('shopping_items_user_id_fkey', 'shopping_items', type_='foreignkey')
    op.drop_constraint('shopping_items_recipe_id_fkey', 'shopping_items', type_='foreignkey')
    op.create_foreign_key(
        'fk_shopping_items_list_id_shopping_lists', 'shopping_items', 'shopping_lists',
        ['list_id'], ['id'], ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_shopping_items_user_id_users', 'shopping_items', 'users',
        ['user_id'], ['id'], ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_shopping_items_recipe_id_recipes', 'shopping_items', 'recipes',
        ['recipe_id'], ['id'], ondelete='SET NULL',
    )

    # --- shopping_list_shares ---
    op.drop_constraint('shopping_list_shares_list_id_fkey', 'shopping_list_shares', type_='foreignkey')
    op.drop_constraint('shopping_list_shares_user_id_fkey', 'shopping_list_shares', type_='foreignkey')
    op.create_foreign_key(
        'fk_shopping_list_shares_list_id_shopping_lists', 'shopping_list_shares', 'shopping_lists',
        ['list_id'], ['id'], ondelete='CASCADE',
    )
    op.create_foreign_key(
        'fk_shopping_list_shares_user_id_users', 'shopping_list_shares', 'users',
        ['user_id'], ['id'], ondelete='CASCADE',
    )

    # --- shopping_lists ---
    op.drop_constraint('shopping_lists_user_id_fkey', 'shopping_lists', type_='foreignkey')
    op.create_foreign_key(
        'fk_shopping_lists_user_id_users', 'shopping_lists', 'users',
        ['user_id'], ['id'], ondelete='CASCADE',
    )

    # --- tags ---
    op.drop_constraint('tags_user_id_fkey', 'tags', type_='foreignkey')
    op.create_foreign_key(
        'fk_tags_user_id_users', 'tags', 'users',
        ['user_id'], ['id'], ondelete='CASCADE',
    )


def downgrade() -> None:
    """Remove ON DELETE rules from all foreign keys."""

    op.drop_constraint('fk_tags_user_id_users', 'tags', type_='foreignkey')
    op.create_foreign_key(None, 'tags', 'users', ['user_id'], ['id'])

    op.drop_constraint('fk_shopping_lists_user_id_users', 'shopping_lists', type_='foreignkey')
    op.create_foreign_key(None, 'shopping_lists', 'users', ['user_id'], ['id'])

    op.drop_constraint('fk_shopping_list_shares_list_id_shopping_lists', 'shopping_list_shares', type_='foreignkey')
    op.drop_constraint('fk_shopping_list_shares_user_id_users', 'shopping_list_shares', type_='foreignkey')
    op.create_foreign_key(None, 'shopping_list_shares', 'shopping_lists', ['list_id'], ['id'])
    op.create_foreign_key(None, 'shopping_list_shares', 'users', ['user_id'], ['id'])

    op.drop_constraint('fk_shopping_items_list_id_shopping_lists', 'shopping_items', type_='foreignkey')
    op.drop_constraint('fk_shopping_items_user_id_users', 'shopping_items', type_='foreignkey')
    op.drop_constraint('fk_shopping_items_recipe_id_recipes', 'shopping_items', type_='foreignkey')
    op.create_foreign_key(None, 'shopping_items', 'shopping_lists', ['list_id'], ['id'])
    op.create_foreign_key(None, 'shopping_items', 'users', ['user_id'], ['id'])
    op.create_foreign_key(None, 'shopping_items', 'recipes', ['recipe_id'], ['id'])

    op.drop_constraint('fk_recipes_user_id_users', 'recipes', type_='foreignkey')
    op.create_foreign_key(None, 'recipes', 'users', ['user_id'], ['id'])

    op.drop_constraint('fk_recipe_tags_recipe_id_recipes', 'recipe_tags', type_='foreignkey')
    op.drop_constraint('fk_recipe_tags_tag_id_tags', 'recipe_tags', type_='foreignkey')
    op.create_foreign_key(None, 'recipe_tags', 'recipes', ['recipe_id'], ['id'])
    op.create_foreign_key(None, 'recipe_tags', 'tags', ['tag_id'], ['id'])

    op.drop_constraint('fk_recipe_shares_recipe_id_recipes', 'recipe_shares', type_='foreignkey')
    op.drop_constraint('fk_recipe_shares_user_id_users', 'recipe_shares', type_='foreignkey')
    op.create_foreign_key(None, 'recipe_shares', 'recipes', ['recipe_id'], ['id'])
    op.create_foreign_key(None, 'recipe_shares', 'users', ['user_id'], ['id'])

    op.drop_constraint('fk_ingredients_recipe_id_recipes', 'ingredients', type_='foreignkey')
    op.create_foreign_key(None, 'ingredients', 'recipes', ['recipe_id'], ['id'])
