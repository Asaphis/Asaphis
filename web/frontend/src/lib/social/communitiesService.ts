import { apiFetch, isRealApiEnabled } from "@/lib/api/http-client";

export interface Community {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  joined: boolean;
  isOpen: boolean;
}

async function dev<T>(value: T): Promise<T> {
  await new Promise((r) => setTimeout(r, 150));
  return value;
}

// Communities (groups). Creation goes through moderation; platform admins
// keep top authority over community moderators. Backend: /groups/*.
export const communitiesService = {
  async list(): Promise<Community[]> {
    if (!isRealApiEnabled()) return dev([]);
    const rows = await apiFetch<unknown[]>("/groups");
    return (Array.isArray(rows) ? rows : []).map((r) => {
      const g = r as { id?: string; name?: string; description?: string; memberCount?: number; joined?: boolean; isOpen?: boolean; members?: unknown[] };
      return {
        id: String(g.id ?? ""),
        name: String(g.name ?? "Community"),
        description: String(g.description ?? ""),
        memberCount: Number(g.memberCount ?? (Array.isArray(g.members) ? g.members.length : 0)),
        joined: Boolean(g.joined ?? false),
        isOpen: Boolean(g.isOpen ?? false),
      };
    });
  },

  async create(input: { name: string; description: string; isOpen?: boolean }): Promise<Community> {
    if (!isRealApiEnabled())
      return dev({ id: `dev-g-${Date.now()}`, name: input.name, description: input.description, memberCount: 1, joined: true, isOpen: input.isOpen ?? true });
    const row = await apiFetch<unknown>("/groups", { method: "POST", body: JSON.stringify(input) });
    const g = row as { id?: string; name?: string; description?: string };
    return { id: String(g.id ?? ""), name: String(g.name ?? input.name), description: String(g.description ?? ""), memberCount: 1, joined: true, isOpen: true };
  },

  async join(id: string): Promise<void> {
    if (!isRealApiEnabled()) return dev(undefined);
    await apiFetch(`/groups/${id}/join`, { method: "POST" });
  },

  async leave(id: string): Promise<void> {
    if (!isRealApiEnabled()) return dev(undefined);
    await apiFetch(`/groups/${id}/leave`, { method: "DELETE" });
  },
};
