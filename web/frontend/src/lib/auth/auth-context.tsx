"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { createApi } from "@/lib/api/api-factory";
import { demoData } from "@/lib/mock-data";

export interface AuthSession {
  token: string;
  email: string;
  memberId: string;
}

interface AuthContextValue {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  completeSignup: (email?: string) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "asaphis-session";

function readStoredSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.token) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setSession(readStoredSession());
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: AuthSession | null) => {
    setSession(next);
    try {
      if (next) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage unavailable (private mode) — keep in-memory session only.
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      // Real: POST /auth/login via NEXT_PUBLIC_API_BASE_URL when set,
      // fallback to mock when backend unreachable (keeps old flow working).
      const api = createApi();
      const result = await api.login({ email, password });
      persist({
        token: result.token,
        email: email.trim().toLowerCase(),
        memberId: result.memberId,
      });
    },
    [persist],
  );

  const completeSignup = useCallback(
    (email?: string) => {
      persist({
        token: `mock-session-${Date.now()}`,
        email: (email ?? "member@asaphis.org").trim().toLowerCase(),
        memberId: demoData.member.memberId,
      });
    },
    [persist],
  );

  const logout = useCallback(async () => {
    try {
      const api = createApi();
      await api.logout();
    } finally {
      persist(null);
    }
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token),
      isLoading,
      login,
      completeSignup,
      logout,
    }),
    [session, isLoading, login, completeSignup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
