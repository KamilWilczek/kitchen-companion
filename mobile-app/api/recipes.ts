import { API_URL } from '@env';
import { RecipeIn, RecipeOut } from '../types/types';



export async function fetchRecipes(): Promise<RecipeOut[]> {
  const res = await fetch(`${API_URL}/recipes/`);
  if (!res.ok) throw new Error(`Failed to fetch recipes: ${res.status}/`);
  return await res.json();
}

export async function createRecipe(recipe: RecipeIn) {
  const res = await fetch(`${API_URL}/recipes/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create recipe (${res.status}): ${text}/`);
  }
  return await res.json();
}

export async function updateRecipe(id: string, recipe: RecipeIn): Promise<RecipeOut> {
  const res = await fetch(`${API_URL}/recipes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe),
  });
  if (!res.ok) throw new Error(`PUT /recipes/${id} ${res.status}`);
  return res.json();
}

export async function deleteRecipe(id: string): Promise<void> {
  const res = await fetch(`${API_URL}/recipes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /recipes/${id} ${res.status}`);
}