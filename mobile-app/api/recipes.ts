import { RecipeIn, RecipeOut, ShoppingItemOut } from '../types/types';
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
    patchRecipe: (id: string, patch: Partial<RecipeIn>) =>
      api<RecipeOut>(`/recipes/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    deleteRecipe: (id: string) => api<void>(`/recipes/${id}`, { method: "DELETE" }),
    addFromRecipe: (listId: string, recipeId: string) =>
      api<ShoppingItemOut[]>(`/recipes/${listId}/from-recipe/${recipeId}`, {
        method: 'POST',
      }),
    addSelectedIngredientsToList: (
      recipeId: string,
      listId: string,
      ingredientIds: string[],
    ) =>
      api<ShoppingItemOut[]>(
        `/recipes/${recipeId}/shopping-lists/${listId}/items`,
        {
          method: 'POST',
          body: JSON.stringify({ ingredient_ids: ingredientIds }),
        },
      ),
  };
}