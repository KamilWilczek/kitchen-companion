import { useApi } from './useApi';

export function useSuggestionsApi() {
  const api = useApi();
  return {
    getSuggestions: (q: string) =>
      api<string[]>(`/suggestions/?q=${encodeURIComponent(q)}`),
  };
}
