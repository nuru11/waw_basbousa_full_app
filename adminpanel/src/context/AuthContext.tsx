import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  api,
  setToken,
  type LoginResponse,
  type User,
} from '../services/api';

const CASHIER_MODE_KEY = 'cashierMode';

function readCashierMode(): boolean {
  return localStorage.getItem(CASHIER_MODE_KEY) === 'true';
}

function persistCashierMode(mode: boolean) {
  if (mode) localStorage.setItem(CASHIER_MODE_KEY, 'true');
  else localStorage.removeItem(CASHIER_MODE_KEY);
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  cashierMode: boolean;
  setCashierMode: (mode: boolean) => void;
  login: (username: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [cashierMode, setCashierModeState] = useState(readCashierMode);

  const setCashierMode = useCallback((mode: boolean) => {
    persistCashierMode(mode);
    setCashierModeState(mode);
  }, []);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const me = await api.get<User>('/auth/me');
      setUser(me);
      setCashierModeState(readCashierMode());
    } catch {
      setToken(null);
      setUser(null);
      persistCashierMode(false);
      setCashierModeState(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (username: string, password: string) => {
    const result = await api.post<LoginResponse>('/auth/login', {
      username,
      password,
    });
    setToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    persistCashierMode(false);
    setCashierModeState(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      cashierMode,
      setCashierMode,
      login,
      logout,
      isAuthenticated: !!user,
    }),
    [user, loading, cashierMode, setCashierMode, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
