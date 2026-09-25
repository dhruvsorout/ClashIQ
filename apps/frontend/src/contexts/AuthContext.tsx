"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getAuthMe, loginUser, registerUser, getUserProfile } from "@/lib/api";
import type { UserProfile } from "@/lib/types";

interface AuthContextValue {
  token: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue>({
  token: null,
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  refreshUser: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Refresh user data (including live rating)
  const refreshUser = useCallback(async () => {
    const currentToken = token ?? (typeof window !== "undefined" ? localStorage.getItem("clashiq_token") : null);
    if (!currentToken) return;

    try {
      const data = await getUserProfile(currentToken);
      setUser(data.user);
    } catch {
      // Ignore if temporarily unreachable
    }
  }, [token]);

  // Rehydrate on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      await Promise.resolve();
      const stored = typeof window !== "undefined" ? localStorage.getItem("clashiq_token") : null;
      if (!stored) {
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const data = await getAuthMe(stored);
        if (!isMounted) return;
        setToken(stored);
        try {
          const profileData = await getUserProfile(stored);
          if (isMounted) setUser(profileData.user);
        } catch {
          if (isMounted) setUser(data.user);
        }
      } catch {
        if (isMounted) {
          localStorage.removeItem("clashiq_token");
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await loginUser(email, password);
    localStorage.setItem("clashiq_token", data.token);
    setToken(data.token);
    try {
      const profile = await getUserProfile(data.token);
      setUser(profile.user);
    } catch {
      setUser(data.user);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string) => {
      await registerUser(email, password);
      await login(email, password);
    },
    [login]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("clashiq_token");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isLoading,
        login,
        register,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
