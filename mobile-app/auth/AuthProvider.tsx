import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { loginRequest, registerRequest, refreshTokenRequest } from '../api/auth';

type AuthContextType = {
  token: string | null;
  plan: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateToken: (newAccessToken: string, newRefreshToken?: string) => Promise<void>;
  refreshSession: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

function decodeBase64Url(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }
  return atob(base64);
}

function getTokenExpiration(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(decodeBase64Url(payload));
    if (decoded.exp) {
      return decoded.exp * 1000;
    }
  } catch {}
  return null;
}

function isTokenExpired(token: string): boolean {
  const exp = getTokenExpiration(token);
  if (!exp) return true;
  return Date.now() >= exp;
}

function getTokenPlan(token: string): string {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(decodeBase64Url(payload));
    return decoded.plan ?? 'free';
  } catch {
    return 'free';
  }
}

const storage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return null;
      return window.localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      if (typeof window === 'undefined') return;
      window.localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshTokenRef = useRef<string | null>(null);
  const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

  const clearRefreshTimer = () => {
    if (refreshTimer.current) {
      clearTimeout(refreshTimer.current);
      refreshTimer.current = null;
    }
  };

  const clearAllTokens = useCallback(async () => {
    clearRefreshTimer();
    refreshTokenRef.current = null;
    refreshPromiseRef.current = null;
    await storage.removeItem(TOKEN_KEY);
    await storage.removeItem(REFRESH_TOKEN_KEY);
    setToken(null);
  }, []);

  const storeTokenPair = useCallback(async (accessToken: string, newRefreshToken: string) => {
    await storage.setItem(TOKEN_KEY, accessToken);
    await storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
    refreshTokenRef.current = newRefreshToken;
    setToken(accessToken);
  }, []);

  const scheduleAutoRefresh = useCallback((accessToken: string) => {
    clearRefreshTimer();
    const exp = getTokenExpiration(accessToken);
    if (!exp) return;

    // Refresh 60 seconds before expiry, minimum 10 seconds from now
    const msUntilRefresh = Math.max(exp - Date.now() - 60_000, 10_000);

    refreshTimer.current = setTimeout(() => {
      refreshSession();
    }, msUntilRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (refreshPromiseRef.current) {
      return refreshPromiseRef.current;
    }

    const doRefresh = async (): Promise<string | null> => {
      const currentRefreshToken = refreshTokenRef.current;
      if (!currentRefreshToken || isTokenExpired(currentRefreshToken)) {
        await clearAllTokens();
        return null;
      }

      try {
        const result = await refreshTokenRequest(currentRefreshToken);
        await storeTokenPair(result.access_token, result.refresh_token);
        scheduleAutoRefresh(result.access_token);
        return result.access_token;
      } catch {
        await clearAllTokens();
        return null;
      } finally {
        refreshPromiseRef.current = null;
      }
    };

    refreshPromiseRef.current = doRefresh();
    return refreshPromiseRef.current;
  }, [clearAllTokens, storeTokenPair, scheduleAutoRefresh]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const storedAccess = await storage.getItem(TOKEN_KEY);
        const storedRefresh = await storage.getItem(REFRESH_TOKEN_KEY);

        if (storedRefresh) {
          refreshTokenRef.current = storedRefresh;
        }

        if (storedAccess && !isTokenExpired(storedAccess)) {
          if (mounted) {
            setToken(storedAccess);
            scheduleAutoRefresh(storedAccess);
          }
        } else if (storedRefresh && !isTokenExpired(storedRefresh)) {
          await refreshSession();
        } else {
          await storage.removeItem(TOKEN_KEY);
          await storage.removeItem(REFRESH_TOKEN_KEY);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      clearRefreshTimer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const result = await loginRequest(email, password);
    await storeTokenPair(result.access_token, result.refresh_token);
    scheduleAutoRefresh(result.access_token);
  }

  async function register(email: string, password: string) {
    await registerRequest(email, password);
    await login(email, password);
  }

  async function logout() {
    await clearAllTokens();
  }

  async function updateToken(newAccessToken: string, newRefreshToken?: string) {
    await storage.setItem(TOKEN_KEY, newAccessToken);
    if (newRefreshToken) {
      await storage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
      refreshTokenRef.current = newRefreshToken;
    }
    setToken(newAccessToken);
    scheduleAutoRefresh(newAccessToken);
  }

  const plan = token ? getTokenPlan(token) : 'free';

  return (
    <AuthContext.Provider
      value={{ token, plan, loading, login, register, logout, updateToken, refreshSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}
