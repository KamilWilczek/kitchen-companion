import { API_URL } from '@env';

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
};

export async function loginRequest(
  email: string,
  password: string,
): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Login failed');
  }

  return res.json();
}

export async function registerRequest(
  email: string,
  password: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Registration failed');
  }
}

export async function refreshTokenRequest(
  refreshToken: string,
): Promise<TokenResponse> {
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!res.ok) {
    throw new Error('Token refresh failed');
  }

  return res.json();
}
