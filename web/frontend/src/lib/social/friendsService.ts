import { apiFetch, isRealApiEnabled } from "@/lib/api/http-client";

export interface FriendPerson {
  id: string;
  name: string;
  initials: string;
  status?: string;
}

export interface FriendRequest {
  id: string;
  name: string;
  initials: string;
  status: string;
}

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "M";
}

async function dev<T>(value: T): Promise<T> {
  await new Promise((r) => setTimeout(r, 150));
  return value;
}

// Friends + follow-requests + discovery. Backend: /friends/* (mutual model).
// Follow (one-way, for creators) arrives with the Follow model migration.
export const friendsService = {
  async search(query: string): Promise<FriendPerson[]> {
    if (!isRealApiEnabled() || !query.trim()) return dev([]);
    const rows = await apiFetch<unknown[]>(`/friends/search?q=${encodeURIComponent(query)}`);
    return (Array.isArray(rows) ? rows : []).map((r) => {
      const p = r as { id?: string; displayName?: string; email?: string };
      const name = p.displayName || (p.email ?? "").split("@")[0] || "Member";
      return { id: String(p.id ?? ""), name, initials: initialsOf(name) };
    });
  },

  async list(): Promise<FriendPerson[]> {
    if (!isRealApiEnabled()) return dev([]);
    const rows = await apiFetch<unknown[]>("/friends");
    return (Array.isArray(rows) ? rows : []).map((r) => {
      const p = r as { id?: string; userId?: string; displayName?: string; email?: string };
      const name = p.displayName || (p.email ?? "").split("@")[0] || "Member";
      const id = String(p.id ?? p.userId ?? "");
      return { id, name, initials: initialsOf(name) };
    });
  },

  async requests(): Promise<FriendRequest[]> {
    if (!isRealApiEnabled()) return dev([]);
    const rows = await apiFetch<unknown[]>("/friends/requests");
    return (Array.isArray(rows) ? rows : []).map((r) => {
      const p = r as { id?: string; displayName?: string; email?: string; status?: string };
      const name = p.displayName || (p.email ?? "").split("@")[0] || "Member";
      return { id: String(p.id ?? ""), name, initials: initialsOf(name), status: String(p.status ?? "PENDING") };
    });
  },

  async request(userId: string): Promise<void> {
    if (!isRealApiEnabled()) return dev(undefined);
    await apiFetch("/friends/requests", { method: "POST", body: JSON.stringify({ userId }) });
  },

  async accept(requestId: string): Promise<void> {
    if (!isRealApiEnabled()) return dev(undefined);
    await apiFetch(`/friends/requests/${requestId}/accept`, { method: "POST" });
  },

  async decline(requestId: string): Promise<void> {
    if (!isRealApiEnabled()) return dev(undefined);
    await apiFetch(`/friends/requests/${requestId}/decline`, { method: "POST" });
  },

  async remove(userId: string): Promise<void> {
    if (!isRealApiEnabled()) return dev(undefined);
    await apiFetch(`/friends/${userId}`, { method: "DELETE" });
  },

  async block(userId: string): Promise<void> {
    if (!isRealApiEnabled()) return dev(undefined);
    await apiFetch(`/friends/${userId}/block`, { method: "POST" });
  },
};
