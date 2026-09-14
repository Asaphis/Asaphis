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
import type { AdminRole } from "@/lib/admin-types";
import { adminRoleLabels } from "@/lib/admin-types";
import { queryClient } from "@/lib/query-client";

export interface AdminSession {
  name: string;
  email: string;
  role: AdminRole;
}

interface AdminAuthValue {
  admin: AdminSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: AdminRole) => Promise<void>;
  switchRole: (role: AdminRole) => void;
  logout: () => void;
  can: (area: AdminArea) => boolean;
}

export type AdminArea =
  | "dashboard"
  | "members"
  | "identity"
  | "content"
  | "cms"
  | "social"
  | "moderation"
  | "community"
  | "payments"
  | "regions"
  | "notifications"
  | "security"
  | "support"
  | "analytics"
  | "settings";

const roleAccess: Record<AdminRole, AdminArea[]> = {
  super: ["dashboard", "members", "identity", "content", "cms", "social", "moderation", "community", "payments", "regions", "notifications", "security", "support", "analytics", "settings"],
  security: ["dashboard", "members", "identity", "security", "support"],
  content: ["dashboard", "content", "cms", "social", "moderation", "notifications", "support"],
  moderator: ["dashboard", "social", "moderation", "community", "support"],
  finance: ["dashboard", "members", "payments", "analytics", "support"],
};

const AdminAuthContext = createContext<AdminAuthValue | null>(null);
const STORAGE_KEY = "asaphis-admin-session";

function readStored(): AdminSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminSession;
    if (!parsed?.email || !parsed?.role) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setAdmin(readStored());
    setIsLoading(false);
  }, []);

  const persist = useCallback((next: AdminSession | null) => {
    setAdmin(next);
    try {
      if (next) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // private mode — memory only
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string, role: AdminRole) => {
      const clean = email.trim().toLowerCase();
      if (!clean.includes("@") || password.length < 8) {
        throw new Error("Enter a valid work email and a password of at least 8 characters.");
      }
      // Real: POST /auth/login when NEXT_PUBLIC_API_BASE_URL is set.
      // Role comes from backend JWT - requested role is dev fallback only.
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
      if (base) {
        const res = await fetch(`${base}/api/v1/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email: clean, password }),
        });
        if (!res.ok) {
          let msg = "Invalid admin credentials.";
          try {
            const d = (await res.json()) as { message?: string };
            if (d.message) msg = d.message;
          } catch {
            // keep default
          }
          throw new Error(msg);
        }
        const data = (await res.json()) as { accessToken?: string; token?: string; roles?: string[] };
        const token = data.accessToken ?? data.token ?? "";
        if (token) {
          try {
            window.localStorage.setItem("asaphis-admin-token", token);
          } catch {
            // ignore
          }
        }
        // Derive display role from backend roles when present; never trust
        // the requested role for authorization — backend RolesGuard decides.
        const backendRoles = Array.isArray(data.roles) ? data.roles.map((r) => String(r).toUpperCase()) : [];
        const mapped: AdminRole = backendRoles.includes("SUPER_ADMIN")
          ? "super"
          : backendRoles.includes("SECURITY_ADMIN")
            ? "security"
            : backendRoles.includes("CONTENT_ADMIN")
              ? "content"
              : backendRoles.includes("FINANCE_ADMIN")
                ? "finance"
                : backendRoles.includes("MODERATOR")
                  ? "moderator"
                  : role;
        const name = clean.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
        persist({ name, email: clean, role: mapped });
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
      const name = clean.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      persist({ name, email: clean, role });
    },
    [persist],
  );

  const switchRole = useCallback(
    (_role: AdminRole) => {
      // Disabled in production: roles come from backend JWT only.
      // Kept as no-op so dev UI calling it does not escalate privileges.
      void _role;
    },
    [],
  );

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem("asaphis-admin-token");
    } catch {
      // ignore
    }
    persist(null);
    // Drop every cached admin row so the next sign-in starts clean.
    queryClient.clear();
  }, [persist]);

  const can = useCallback((area: AdminArea) => (admin ? roleAccess[admin.role].includes(area) : false), [admin]);

  const value = useMemo<AdminAuthValue>(
    () => ({ admin, isLoading, isAuthenticated: Boolean(admin), login, switchRole, logout, can }),
    [admin, isLoading, login, switchRole, logout, can],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

export function roleLabel(role: AdminRole) {
  return adminRoleLabels[role];
}
