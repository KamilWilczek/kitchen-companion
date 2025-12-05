import type {
  ShoppingItemIn,
  ShoppingItemOut,
  ShoppingListIn,
  ShoppingListOut,
} from 'types/types';
import { useApi } from './useApi';

export function useShoppingListApi() {
  const api = useApi();
  const base = "/shopping-lists";

  return {
    // ---------- Lists ----------

    getShoppingLists: () =>
      api<ShoppingListOut[]>(`${base}/`),

    createShoppingList: (payload: ShoppingListIn) =>
      api<ShoppingListOut>(`${base}/`, {
        method: "POST",
        body: JSON.stringify(payload),
      }),

    getShoppingList: (listId: string) =>
      api<ShoppingListOut>(`${base}/${listId}`),

    updateShoppingList: (
      listId: string,
      patch: Partial<ShoppingListIn>
    ) =>
      api<ShoppingListOut>(`${base}/${listId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),

    deleteShoppingList: (listId: string) =>
      api<void>(`${base}/${listId}`, {
        method: "DELETE",
      }),

    shareShoppingList: (listId: string, email: string) =>
      api<void>(`${base}/${listId}/share`, {
        method: "POST",
        body: JSON.stringify({ shared_with_email: email }),
      }),

    unshareShoppingList: (listId: string, userId: string) =>
      api<void>(`${base}/${listId}/share/${userId}`, {
        method: "DELETE",
      }),

    // ---------- Items (nested under list) ----------

    getShoppingListItems: (listId: string) =>
      api<ShoppingItemOut[]>(`${base}/${listId}/items`),

    addShoppingItem: (listId: string, item: ShoppingItemIn) =>
      api<ShoppingItemOut>(`${base}/${listId}/items`, {
        method: "POST",
        body: JSON.stringify(item),
      }),

    patchShoppingItem: (
      listId: string,
      itemId: string,
      patch: Partial<ShoppingItemIn> & { checked?: boolean }
    ) =>
      api<ShoppingItemOut>(`${base}/${listId}/items/${itemId}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),

    deleteShoppingItem: (listId: string, itemId: string) =>
      api<void>(`${base}/${listId}/items/${itemId}`, {
        method: "DELETE",
      }),

    clearShoppingList: (listId: string, clearChecked = false) =>
      api<void>(
        `${base}/${listId}/items${clearChecked ? '?clear_checked=true' : ''}`,
        { method: "DELETE" }
      ),

    removeRecipeFromList: (listId: string, recipeId: string) =>
      api<void>(`${base}/${listId}/recipes/${recipeId}`, {
        method: "DELETE",
      }),
  };
}