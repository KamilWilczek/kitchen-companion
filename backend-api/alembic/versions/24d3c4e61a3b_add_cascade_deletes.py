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

# Naming convention lets batch mode find unnamed FK constraints by convention.
convention = {
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
}


def upgrade() -> None:
    """Add ON DELETE CASCADE / SET NULL to all foreign keys."""

    # --- ingredients ---
    with op.batch_alter_table('ingredients', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_ingredients_recipe_id_recipes', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_ingredients_recipe_id_recipes', 'recipes',
            ['recipe_id'], ['id'], ondelete='CASCADE',
        )

    # --- recipe_shares ---
    with op.batch_alter_table('recipe_shares', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_recipe_shares_recipe_id_recipes', type_='foreignkey')
        batch_op.drop_constraint('fk_recipe_shares_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_recipe_shares_recipe_id_recipes', 'recipes',
            ['recipe_id'], ['id'], ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            'fk_recipe_shares_user_id_users', 'users',
            ['user_id'], ['id'], ondelete='CASCADE',
        )

    # --- recipe_tags ---
    with op.batch_alter_table('recipe_tags', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_recipe_tags_recipe_id_recipes', type_='foreignkey')
        batch_op.drop_constraint('fk_recipe_tags_tag_id_tags', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_recipe_tags_recipe_id_recipes', 'recipes',
            ['recipe_id'], ['id'], ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            'fk_recipe_tags_tag_id_tags', 'tags',
            ['tag_id'], ['id'], ondelete='CASCADE',
        )

    # --- recipes ---
    with op.batch_alter_table('recipes', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_recipes_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_recipes_user_id_users', 'users',
            ['user_id'], ['id'], ondelete='CASCADE',
        )

    # --- shopping_items ---
    with op.batch_alter_table('shopping_items', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_shopping_items_list_id_shopping_lists', type_='foreignkey')
        batch_op.drop_constraint('fk_shopping_items_user_id_users', type_='foreignkey')
        batch_op.drop_constraint('fk_shopping_items_recipe_id_recipes', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_shopping_items_list_id_shopping_lists', 'shopping_lists',
            ['list_id'], ['id'], ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            'fk_shopping_items_user_id_users', 'users',
            ['user_id'], ['id'], ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            'fk_shopping_items_recipe_id_recipes', 'recipes',
            ['recipe_id'], ['id'], ondelete='SET NULL',
        )

    # --- shopping_list_shares ---
    with op.batch_alter_table('shopping_list_shares', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_shopping_list_shares_list_id_shopping_lists', type_='foreignkey')
        batch_op.drop_constraint('fk_shopping_list_shares_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_shopping_list_shares_list_id_shopping_lists', 'shopping_lists',
            ['list_id'], ['id'], ondelete='CASCADE',
        )
        batch_op.create_foreign_key(
            'fk_shopping_list_shares_user_id_users', 'users',
            ['user_id'], ['id'], ondelete='CASCADE',
        )

    # --- shopping_lists ---
    with op.batch_alter_table('shopping_lists', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_shopping_lists_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_shopping_lists_user_id_users', 'users',
            ['user_id'], ['id'], ondelete='CASCADE',
        )

    # --- tags ---
    with op.batch_alter_table('tags', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_tags_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_tags_user_id_users', 'users',
            ['user_id'], ['id'], ondelete='CASCADE',
        )


def downgrade() -> None:
    """Remove ON DELETE rules from all foreign keys."""

    with op.batch_alter_table('tags', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_tags_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_tags_user_id_users', 'users', ['user_id'], ['id'],
        )

    with op.batch_alter_table('shopping_lists', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_shopping_lists_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_shopping_lists_user_id_users', 'users', ['user_id'], ['id'],
        )

    with op.batch_alter_table('shopping_list_shares', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_shopping_list_shares_list_id_shopping_lists', type_='foreignkey')
        batch_op.drop_constraint('fk_shopping_list_shares_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_shopping_list_shares_list_id_shopping_lists', 'shopping_lists',
            ['list_id'], ['id'],
        )
        batch_op.create_foreign_key(
            'fk_shopping_list_shares_user_id_users', 'users',
            ['user_id'], ['id'],
        )

    with op.batch_alter_table('shopping_items', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_shopping_items_list_id_shopping_lists', type_='foreignkey')
        batch_op.drop_constraint('fk_shopping_items_user_id_users', type_='foreignkey')
        batch_op.drop_constraint('fk_shopping_items_recipe_id_recipes', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_shopping_items_list_id_shopping_lists', 'shopping_lists',
            ['list_id'], ['id'],
        )
        batch_op.create_foreign_key(
            'fk_shopping_items_user_id_users', 'users',
            ['user_id'], ['id'],
        )
        batch_op.create_foreign_key(
            'fk_shopping_items_recipe_id_recipes', 'recipes',
            ['recipe_id'], ['id'],
        )

    with op.batch_alter_table('recipes', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_recipes_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_recipes_user_id_users', 'users', ['user_id'], ['id'],
        )

    with op.batch_alter_table('recipe_tags', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_recipe_tags_recipe_id_recipes', type_='foreignkey')
        batch_op.drop_constraint('fk_recipe_tags_tag_id_tags', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_recipe_tags_recipe_id_recipes', 'recipes',
            ['recipe_id'], ['id'],
        )
        batch_op.create_foreign_key(
            'fk_recipe_tags_tag_id_tags', 'tags',
            ['tag_id'], ['id'],
        )

    with op.batch_alter_table('recipe_shares', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_recipe_shares_recipe_id_recipes', type_='foreignkey')
        batch_op.drop_constraint('fk_recipe_shares_user_id_users', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_recipe_shares_recipe_id_recipes', 'recipes',
            ['recipe_id'], ['id'],
        )
        batch_op.create_foreign_key(
            'fk_recipe_shares_user_id_users', 'users',
            ['user_id'], ['id'],
        )

    with op.batch_alter_table('ingredients', naming_convention=convention) as batch_op:
        batch_op.drop_constraint('fk_ingredients_recipe_id_recipes', type_='foreignkey')
        batch_op.create_foreign_key(
            'fk_ingredients_recipe_id_recipes', 'recipes',
            ['recipe_id'], ['id'],
        )
