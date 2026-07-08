import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../lib/api.js';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'MANAGER' | 'STAFF';
  phone?: string | null;
  avatar?: string | null;
  lineUserId?: string | null;
  lineDisplayName?: string | null;
  locationId?: string | null;
  preferredLanguage?: string | null;
}

interface AuthContextValue {
  token: string;
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    api.get<{ data: { user: User } }>('/auth/me')
      .then((data) => {
        if (!cancelled) {
          setUser(data.data.user);
        }
      })
      .catch(() => {
        if (!cancelled) {
          // Token invalid — clear it
          localStorage.removeItem('token');
          setToken('');
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  function login(newToken: string) {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
  }

  async function refreshUser() {
    if (!token) return;
    try {
      const res = await api.get<{ data: { user: User } }>('/auth/me');
      if (res) {
        setUser(res.data.user);
      }
    } catch (error) {
      console.error('Failed to refresh user', error);
    }
  }

  return (
    <AuthContext.Provider value={{ token, user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
