import { RecipeIn, RecipeOut } from '../types/types';
import { useApi } from './useApi';


export function useRecipesApi() {
  const api = useApi();
  return {
    fetchRecipes: () => api<RecipeOut[]>("/recipes/"),
    createRecipe: (recipe: RecipeIn) => api<RecipeOut>("/recipes/", {
      method: "POST",
      body: JSON.stringify(recipe),
    }),
    updateRecipe: (id: string, recipe: RecipeIn) => api<RecipeOut>(`/recipes/${id}`, {
      method: "PUT",
      body: JSON.stringify(recipe),
    }),
    deleteRecipe: (id: string) => api<void>(`/recipes/${id}`, { method: "DELETE" }),
  }
}