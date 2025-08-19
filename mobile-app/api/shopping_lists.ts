import { API_URL } from '@env';
import type { ShoppingItemIn, ShoppingItemOut } from 'types/types';

export async function getShoppingList(): Promise<ShoppingItemOut[]> {
  const res = await fetch(`${API_URL}/shopping-list/`);
  if (!res.ok) throw new Error(`GET /shopping-list/ ${res.status}`);
  return res.json();
}

export async function addShoppingItem(item: ShoppingItemIn): Promise<ShoppingItemOut> {
  const res = await fetch(`${API_URL}/shopping-list/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error(`POST /shopping-list/ ${res.status}`);
  return res.json();
}

export async function patchShoppingItem(id: string, patch: Partial<ShoppingItemIn> & { checked?: boolean }): Promise<ShoppingItemOut> {
  const res = await fetch(`${API_URL}/shopping-list/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  if (!res.ok) throw new Error(`PATCH /shopping-list/${id} ${res.status}`);
  return res.json();
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/shopping-list/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE /shopping-list/${id} ${res.status}`);
}

export async function clearShoppingList(clearChecked = false): Promise<void> {
  const url = `${API_URL}/shopping-list/${clearChecked ? '?clear_checked=true' : ''}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error(`DELETE /shopping-list/ ${res.status}`);
}

export async function addFromRecipe(recipeId: string): Promise<ShoppingItemOut[]> {
  const res = await fetch(`${API_URL}/shopping-list/from-recipe/${recipeId}`, { method: 'POST' });
  if (!res.ok) throw new Error(`POST /shopping-list/from-recipe/${recipeId} ${res.status}`);
  return res.json();
}