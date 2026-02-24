import { CategoryOut, CategoryIn } from '../types/types';
import { useApi } from './useApi';

export function useCategoriesApi() {
  const api = useApi();
  return {
    listCategories: () => api<CategoryOut[]>('/categories/'),
    createCategory: (data: CategoryIn) =>
      api<CategoryOut>('/categories/', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    updateCategory: (id: string, data: CategoryIn) =>
      api<CategoryOut>(`/categories/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    deleteCategory: (id: string) =>
      api<void>(`/categories/${id}`, { method: 'DELETE' }),
  };
}
