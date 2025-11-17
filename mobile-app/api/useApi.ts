import { API_URL } from '@env';
import { useUserId } from 'auth/UserIdProvider';
import { useAuth } from 'auth/AuthProvider';

export function useApi__old() {
  const userId = useUserId();
  return async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": userId,
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`${init?.method ?? "GET"} ${path}: ${res.status} ${text}`);
    }
    return (res.status === 204 ? undefined : res.json()) as T;
  };
}


export function useApi() {
  const { token } = useAuth();

  return async function api<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init?.headers || {}),
      },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`${init?.method ?? 'GET'} ${path}: ${res.status} ${text}`);
    }

    return (res.status === 204 ? undefined : res.json()) as T;
  };
}