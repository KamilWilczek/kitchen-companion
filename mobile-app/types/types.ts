export type UUID = string;

export interface IngredientOut {
  id: UUID;
  name: string;
  quantity: number;
  unit: string;
}

export interface IngredientIn {
  name: string;
  quantity: number;
  unit: string;
}
export interface TagOut {
  id: UUID;
  name: string;
}

export interface RecipeIn {
  title: string;
  description: string;
  source?: string | null;
  ingredients: IngredientIn[];
  tag_ids: UUID[];
}

export interface RecipeOut {
  id: UUID;
  title: string;
  description: string;
  source?: string | null;
  ingredients: IngredientOut[];
  tag_ids: UUID[];
  tags: TagOut[];
  shared_with_users: { id: UUID; email: string }[];
}

// ---------- Shopping Lists ----------

export interface ShoppingListIn {
  name: string;
  description?: string | null;
}

export interface ShoppingListOut extends ShoppingListIn {
  id: UUID;
  total_items: number;
  checked_items: number;
  shared_with_users: { id: UUID; email: string }[];
}

// ---------- Shopping Items ----------

export interface ShoppingItemIn {
  name: string;
  quantity: number;
  unit?: string | null;
  recipe_id?: string | null;
}

export interface ShoppingItemOut extends ShoppingItemIn {
  id: UUID;
  checked: boolean;
}