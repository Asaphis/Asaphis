// Real HTTP client for AsaPhis frontend.
// Everything reads from environment - no hardcoded API URLs.
// Required env: NEXT_PUBLIC_API_BASE_URL (e.g. https://api.asaphis.org or http://localhost:4000)
// Backend prefix is /api/v1 (see backend/src/main.ts).

export function getApiBaseUrl(): string {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
  return base;
}

export function isRealApiEnabled(): boolean {
  return getApiBaseUrl().length > 0;
}

function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const clean = path.startsWith("/") ? path : `/${path}`;
  // Backend uses global prefix api/v1
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  if (clean.startsWith("/api/v1")) return `${base}${clean}`;
  // Allow callers to pass "auth/login" -> "<base>/api/v1/auth/login"
  return `${base}/api/v1${clean}`;
}

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem("asaphis-session");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token?: string };
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: "include",
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
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
