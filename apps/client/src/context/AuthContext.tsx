// Auth Context for global authentication state

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type User, type LoginCredentials } from '../api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials, tenantId?: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing auth on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = authApi.getStoredToken();
      if (token) {
        try {
          // Try to refresh to validate token and get user data
          await authApi.refreshToken();
          // For now, we don't have a /me endpoint, so we'll parse from stored data
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        } catch {
          // Token invalid, clear auth
          authApi.logout();
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials: LoginCredentials, tenantId?: string) => {
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await authApi.login(credentials, tenantId);
      setUser(response.user);
      // Store user for persistence
      localStorage.setItem('user', JSON.stringify(response.user));
    } catch (err) {
      const message = err instanceof Error ? err.message : 
        (err as { message?: string })?.message || 'Login failed';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        error,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
