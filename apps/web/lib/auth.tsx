"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authApi } from "./api";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      setAccessToken(token);
      setUser(JSON.parse(userData));
    }
    setIsLoading(false);

    const handleSessionExpired = () => {
      setAccessToken(null);
      setUser(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      window.location.href = "/login?reason=expired";
    };

    const handleSessionRefreshed = (e: any) => {
      if (e.detail && e.detail.accessToken) {
        setAccessToken(e.detail.accessToken);
      }
    };

    window.addEventListener("session:expired", handleSessionExpired);
    window.addEventListener("session:refreshed", handleSessionRefreshed);

    return () => {
      window.removeEventListener("session:expired", handleSessionExpired);
      window.removeEventListener("session:refreshed", handleSessionRefreshed);
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    setAccessToken(res.accessToken);
    setUser(res.user);
    localStorage.setItem("accessToken", res.accessToken);
    localStorage.setItem("refreshToken", res.refreshToken);
    localStorage.setItem("user", JSON.stringify(res.user));
  };

  const logout = async () => {
    const token = localStorage.getItem("accessToken");
    const refreshToken = localStorage.getItem("refreshToken");
    if (token) {
      await authApi.logout(token, refreshToken || undefined).catch(() => {});
    }
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
