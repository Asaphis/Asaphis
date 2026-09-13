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
import { queryClient } from "@/lib/query-client";

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
  register: (input: { name: string; email: string; password: string; phone?: string; countryOfCitizenship?: string }) => Promise<void>;
  completeSignup: (email?: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
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

  const register = useCallback(
    async (input: { name: string; email: string; password: string; phone?: string; countryOfCitizenship?: string }) => {
      const api = createApi();
      const result = await api.register(input);
      // Backend returns tokens on login only; after register, log the user in
      // so onboarding (phone/identity/payment) can proceed with a real session.
      try {
        const logged = await api.login({ email: input.email, password: input.password });
        persist({ token: logged.token, email: input.email.trim().toLowerCase(), memberId: logged.memberId });
      } catch {
        persist({ token: `pending-${result.userId}`, email: input.email.trim().toLowerCase(), memberId: result.memberId ?? "" });
      }
    },
    [persist],
  );

  const completeSignup = useCallback(
    async (email?: string) => {
      // Legacy JoinJourney callback — now tries real register with a
      // generated password handoff instead of fabricating a mock-session.
      // The full Join form should call register() directly.
      const fallbackEmail = (email ?? "member@asaphis.org").trim().toLowerCase();
      try {
        const api = createApi();
        await api.register({ name: fallbackEmail.split("@")[0], email: fallbackEmail, password: `Temp${Date.now().toString().slice(-6)}!Aa` });
        const logged = await api.login({ email: fallbackEmail, password: "" }).catch(() => null);
        if (logged) {
          persist({ token: logged.token, email: fallbackEmail, memberId: logged.memberId });
          return;
        }
      } catch {
        // fall through to local pending session so UI never hard-breaks offline
      }
      persist({
        token: `pending-signup-${Date.now()}`,
        email: fallbackEmail,
        memberId: "",
      });
    },
    [persist],
  );

  const requestPasswordReset = useCallback(async (email: string) => {
    const api = createApi();
    await api.requestPasswordReset(email);
  }, []);

  const logout = useCallback(async () => {
    try {
      const api = createApi();
      await api.logout();
    } finally {
      persist(null);
      // Drop every cached member row so the next login starts clean.
      queryClient.clear();
    }
  }, [persist]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session?.token) && !session?.token.startsWith("pending-"),
      isLoading,
      login,
      register,
      completeSignup,
      requestPasswordReset,
      logout,
    }),
    [session, isLoading, login, register, completeSignup, requestPasswordReset, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
