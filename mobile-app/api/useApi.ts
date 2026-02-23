import { API_URL } from '@env';
import { useAuth } from 'auth/AuthProvider';

export function useApi() {
  const { token, logout } = useAuth();

  return async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });

    if (res.status === 401) {
      await logout();
      throw new Error('Session expired. Please log in again.');
    }

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${init?.method ?? 'GET'} ${path}: ${res.status} ${text}`);
    }

    return (res.status === 204 ? undefined : res.json()) as T;
  };
}