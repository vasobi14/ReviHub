import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import { refreshAccessToken, setAccessToken } from '../api/auth';
import {
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
  fetchMe,
} from '../api/client';
import type { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  authLoading: boolean;
  logout: () => Promise<void>;
  // The user's role is ADMIN
  isAdmin: boolean;
  // Admin features are shown: an admin who is not previewing the user view
  adminMode: boolean;
  viewAsUser: boolean;
  toggleViewAsUser: () => void;
}

const VIEW_AS_USER_KEY = 'reviews-view-as-user';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewAsUser, setViewAsUser] = useState(() => {
    try {
      return sessionStorage.getItem(VIEW_AS_USER_KEY) === '1';
    } catch {
      return false;
    }
  });

  const isAdmin = user?.role === 'ADMIN';
  const adminMode = isAdmin && !viewAsUser;

  // Only changes what the UI shows: the API still treats the user as an admin
  const toggleViewAsUser = () => {
    const next = !viewAsUser;
    setViewAsUser(next);
    try {
      if (next) sessionStorage.setItem(VIEW_AS_USER_KEY, '1');
      else sessionStorage.removeItem(VIEW_AS_USER_KEY);
    } catch {}
  };

  useEffect(() => {
    (async () => {
      try {
        const token = await refreshAccessToken();
        if (token) {
          const me = await fetchMe();
          setUser(me);
        }
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    const handleLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, user } = await apiLogin(email, password);
    setAccessToken(accessToken);
    setUser(user);
  };

  const register = async (email: string, password: string, name?: string) => {
    await apiRegister(email, password, name);
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        authLoading,
        logout,
        adminMode,
        isAdmin,
        viewAsUser,
        toggleViewAsUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
