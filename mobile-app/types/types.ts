export type UUID = string;

export interface Ingredient {
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
  ingredients: Ingredient[];
  tag_ids?: UUID[];
}

export interface RecipeOut extends RecipeIn {
    id: UUID;
    tags: TagOut[];
  }

export interface ShoppingItemIn {
  name: string;
  quantity: number;
  unit: string;
  recipe_id?: string;
}

export interface ShoppingItemOut extends ShoppingItemIn {
  id: UUID;
  checked: boolean;
}