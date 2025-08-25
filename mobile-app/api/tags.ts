import { TagOut } from '../types/types';
import { useApi } from './useApi';

export function useTagsApi() {
  const api = useApi();
  return {
    listTags: () => api<TagOut[]>("/tags/"),
    createTag: (name: string) =>
      api<TagOut>("/tags/", {
        method: "POST",
        body: JSON.stringify({ name: name.trim().toLowerCase() }),
      }),
    renameTag: (id: string, name: string) =>
      api<TagOut>(`/tags/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: name.trim().toLowerCase() }),
      }),
    deleteTag: (id: string) => api<void>(`/tags/${id}`, { method: "DELETE" }),
  };
}