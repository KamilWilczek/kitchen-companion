import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { loginRequest, registerRequest } from '../api/auth';

type AuthContextType = {
  token: string | null;
  plan: string;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateToken: (newToken: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'authToken';

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
  } catch {
  }
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
  const expirationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearExpirationTimer = () => {
    if (expirationTimer.current) {
      clearTimeout(expirationTimer.current);
      expirationTimer.current = null;
    }
  };

  const scheduleAutoLogout = (tokenValue: string) => {
    clearExpirationTimer();
    const exp = getTokenExpiration(tokenValue);
    if (!exp) return;

    const msUntilExpiry = exp - Date.now();
    if (msUntilExpiry <= 0) {
      storage.removeItem(TOKEN_KEY);
      setToken(null);
      return;
    }

    expirationTimer.current = setTimeout(() => {
      storage.removeItem(TOKEN_KEY);
      setToken(null);
    }, msUntilExpiry);
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await storage.getItem(TOKEN_KEY);
        if (mounted && stored) {
          if (isTokenExpired(stored)) {
            await storage.removeItem(TOKEN_KEY);
          } else {
            setToken(stored);
            scheduleAutoLogout(stored);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
      clearExpirationTimer();
    };
  }, []);

  async function login(email: string, password: string) {
    const result = await loginRequest(email, password);
    await storage.setItem(TOKEN_KEY, result.access_token);
    setToken(result.access_token);
    scheduleAutoLogout(result.access_token);
  }

  async function register(email: string, password: string) {
    await registerRequest(email, password);
    await login(email, password);
  }

  async function logout() {
    clearExpirationTimer();
    await storage.removeItem(TOKEN_KEY);
    setToken(null);
  }

  async function updateToken(newToken: string) {
    await storage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    scheduleAutoLogout(newToken);
  }

  const plan = token ? getTokenPlan(token) : 'free';

  return (
    <AuthContext.Provider value={{ token, plan, loading, login, register, logout, updateToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('AuthProvider missing');
  return ctx;
}