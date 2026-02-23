import { API_URL } from '@env';
import { useAuth } from 'auth/AuthProvider';
import { useRef, useCallback } from 'react';

export function useApi() {
  const { token, logout, refreshSession } = useAuth();
  const tokenRef = useRef(token);
  tokenRef.current = token;

  return useCallback(
    async function api<T>(path: string, init?: RequestInit): Promise<T> {
      function doFetch(bearerToken: string | null): Promise<Response> {
        return fetch(`${API_URL}${path}`, {
          ...init,
          headers: {
            'Content-Type': 'application/json',
            ...(bearerToken ? { Authorization: `Bearer ${bearerToken}` } : {}),
            ...(init?.headers || {}),
          },
        });
      }

      let res = await doFetch(tokenRef.current);

      if (res.status === 401) {
        const newToken = await refreshSession();
        if (newToken) {
          res = await doFetch(newToken);
        }

        if (res.status === 401) {
          await logout();
          throw new Error('Session expired. Please log in again.');
        }
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${init?.method ?? 'GET'} ${path}: ${res.status} ${text}`);
      }

      return (res.status === 204 ? undefined : res.json()) as T;
    },
    [token, logout, refreshSession],
  );
}
