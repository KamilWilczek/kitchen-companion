import type { ShoppingItemIn, ShoppingItemOut } from 'types/types';
import { useApi } from './useApi';

export function useShoppingListApi() {
  const api = useApi();
  return {
    getShoppingList: () => api<ShoppingItemOut[]>("/shopping-list/"),
    addShoppingItem: (item: ShoppingItemIn) =>
      api<ShoppingItemOut>("/shopping-list/", {
        method: "POST",
        body: JSON.stringify(item),
      }),
    patchShoppingItem: (id: string, patch: Partial<ShoppingItemIn> & { checked?: boolean }) =>
      api<ShoppingItemOut>(`/shopping-list/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    deleteShoppingItem: (id: string) =>
      api<void>(`/shopping-list/${id}`, { method: "DELETE" }),
    clearShoppingList: (clearChecked = false) =>
      api<void>(`/shopping-list/${clearChecked ? '?clear_checked=true' : ''}`, { method: "DELETE" }),
    addFromRecipe: (recipeId: string) =>
      api<ShoppingItemOut[]>(`/shopping-list/from-recipe/${recipeId}`, { method: "POST" }),
  };
}