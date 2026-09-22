"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { getMe, loginUser } from "@/lib/api";
import type { AuthUser } from "@/lib/types";

interface AuthContextValue {
  token: string | null;
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  isLoading: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("clashiq_token");
    if (!stored) {
      setIsLoading(false);
      return;
    }

    getMe(stored)
      .then((data) => {
        setToken(stored);
        setUser({ email: data.email, username: data.username });
      })
      .catch(() => {
        localStorage.removeItem("clashiq_token");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginUser(email, password);
    const me = await getMe(data.token);
    localStorage.setItem("clashiq_token", data.token);
    setToken(data.token);
    setUser({ email: me.email, username: me.username });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("clashiq_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
