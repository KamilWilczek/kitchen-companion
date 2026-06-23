import type { MealPlanEntry, MealSlot } from 'types/types';
import { useApi } from './useApi';

export function useMealPlanApi() {
  const api = useApi();

  return {
    getWeek: (weekStart: string) =>
      api<MealPlanEntry[]>(`/meal-plan/?week_start=${weekStart}`),

    assignRecipe: (date: string, slot: MealSlot, recipeId: string) =>
      api<MealPlanEntry>(`/meal-plan/${date}/${slot}`, {
        method: 'PUT',
        body: JSON.stringify({ recipe_id: recipeId }),
      }),

    removeRecipe: (date: string, slot: MealSlot) =>
      api<void>(`/meal-plan/${date}/${slot}`, { method: 'DELETE' }),
  };
}
