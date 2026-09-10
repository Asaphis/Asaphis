// Real HTTP client for AsaPhis admin.
// Env-driven, no hardcoded URLs. Requires NEXT_PUBLIC_API_BASE_URL.

export function getAdminApiBase(): string {
  return (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
}

export function isAdminRealApiEnabled(): boolean {
  return getAdminApiBase().length > 0;
}

function adminUrl(path: string): string {
  const base = getAdminApiBase();
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  const clean = path.startsWith("/") ? path : `/${path}`;
  if (clean.startsWith("/api/v1")) return `${base}${clean}`;
  return `${base}/api/v1${clean}`;
}

function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    // Real JWT stored after POST /auth/login (admin reuses same endpoint, role from JWT)
    const jwt = window.localStorage.getItem("asaphis-admin-token");
    if (jwt) return jwt;
    return null;
  } catch {
    return null;
  }
}

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAdminToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(adminUrl(path), { ...init, headers, credentials: "include" });
  if (!res.ok) {
    let message = `Admin request failed (${res.status})`;
    try {
      const data = await res.json();
      message = (data as { message?: string })?.message ?? message;
    } catch {
      // keep default
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
