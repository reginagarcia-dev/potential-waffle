import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'shared';
import { apiFetch, getAccessToken, setAccessToken } from '../lib/api.js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPreferences: (preferredUnit: 'lbs' | 'kg', defaultRestSeconds: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Silent login attempt on mount
  useEffect(() => {
    async function attemptSilentLogin() {
      try {
        const data = await apiFetch('/auth/refresh', { method: 'POST', skipAuth: true });
        if (data && data.accessToken && data.user) {
          setAccessToken(data.accessToken);
          setUser(data.user);
        }
      } catch (err) {
        // Silent login failed, user is not logged in
      } finally {
        setLoading(false);
      }
    }
    attemptSilentLogin();
  }, []);

  // Re-authenticate when the app becomes visible again (mobile tab resume)
  useEffect(() => {
    async function handleVisibilityChange() {
      if (document.visibilityState !== 'visible') return;
      if (getAccessToken()) return; // token still in memory, no action needed
      try {
        const data = await apiFetch('/auth/refresh', { method: 'POST', skipAuth: true });
        if (data?.accessToken && data?.user) {
          setAccessToken(data.accessToken);
          setUser(data.user);
        } else {
          setUser(null);
        }
      } catch {
        // Don't clear user on network error — they may just be temporarily offline
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    if (data && data.accessToken && data.user) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
  };

  const register = async (email: string, password: string) => {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    if (data && data.accessToken && data.user) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
  };

  const logout = async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout error on server:', err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateUserPreferences = async (preferredUnit: 'lbs' | 'kg', defaultRestSeconds: number) => {
    const updatedUser = await apiFetch('/auth/preferences', {
      method: 'PATCH',
      body: JSON.stringify({ preferredUnit, defaultRestSeconds }),
    });
    if (updatedUser) {
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUserPreferences }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
