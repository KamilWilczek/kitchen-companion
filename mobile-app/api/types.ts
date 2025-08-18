export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeIn {
  title: string;
  description: string;
  ingredients: Ingredient[];
}

export interface RecipeOut extends RecipeIn {
    id: string;
  }