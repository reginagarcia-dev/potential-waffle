import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "shared";
import {
  apiFetch,
  getAccessToken,
  onSessionInvalidated,
  refreshSession,
  setAccessToken,
} from "../lib/api.js";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserPreferences: (
    preferredUnit: "lbs" | "kg",
    defaultRestSeconds: number,
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Silent login attempt on mount
  useEffect(() => {
    async function attemptSilentLogin() {
      const data = await refreshSession();
      if (data.status === "success") {
        setUser(data.user as User);
      }
      setLoading(false);
    }
    attemptSilentLogin();
  }, []);

  // Re-authenticate when the app becomes visible again (mobile tab resume)
  useEffect(() => {
    async function handleVisibilityChange() {
      if (document.visibilityState !== "visible") return;
      if (getAccessToken()) return; // token still in memory, no action needed
      const data = await refreshSession();
      if (data.status === "success") {
        setUser(data.user as User);
      }
      // On failure keep the current user — they may just be temporarily
      // offline; the next authorized request will surface a real logout.
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Clear the current user as soon as the refresh token is confirmed invalid.
  useEffect(() => onSessionInvalidated(() => setUser(null)), []);

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipAuth: true,
    });
    if (data && data.accessToken && data.user) {
      setAccessToken(data.accessToken);
      setUser(data.user);
    }
  };

  const register = async (email: string, password: string) => {
    const data = await apiFetch("/auth/register", {
      method: "POST",
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
      await apiFetch("/auth/logout", { method: "POST" });
    } catch (err) {
      console.error("Logout error on server:", err);
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  };

  const updateUserPreferences = async (
    preferredUnit: "lbs" | "kg",
    defaultRestSeconds: number,
  ) => {
    const updatedUser = await apiFetch("/auth/preferences", {
      method: "PATCH",
      body: JSON.stringify({ preferredUnit, defaultRestSeconds }),
    });
    if (updatedUser) {
      setUser(updatedUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, updateUserPreferences }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
