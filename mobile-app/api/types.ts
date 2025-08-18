export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface TagOut {
  id: string;
  name: string;
}

export interface RecipeIn {
  title: string;
  description: string;
  source?: string | null;
  ingredients: Ingredient[];
  tag_ids: string[];
}

export interface RecipeOut extends RecipeIn {
    id: string;
    tags: TagOut[];
  }