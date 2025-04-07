import { API_URL } from '@env';

export async function fetchRecipes() {
  const res = await fetch(`${API_URL}/recipes`);
  return await res.json();
}

export async function createRecipe(recipe) {
  const res = await fetch(`${API_URL}/recipes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe)
  });
  return await res.json();
}