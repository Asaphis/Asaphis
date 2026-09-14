import { apiFetch, isRealApiEnabled } from "@/lib/api/http-client";

export interface Conversation {
  id: string;
  title: string;
  initials: string;
  lastBody: string;
  unread: boolean;
}

export interface ChatMessage {
  id: string;
  mine: boolean;
  body: string;
  createdAt: string;
}

async function dev<T>(value: T): Promise<T> {
  await new Promise((r) => setTimeout(r, 150));
  return value;
}

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "M";
}

// Private messaging. Strangers go through requests (friends-only start).
// Backend: /messages/conversations*. Rate-limit/spam/block enforced server-side.
export const messagesService = {
  async conversations(): Promise<Conversation[]> {
    if (!isRealApiEnabled()) return dev([]);
    const rows = await apiFetch<unknown[]>("/messages/conversations");
    return (Array.isArray(rows) ? rows : []).map((r) => {
      const c = r as { id?: string; title?: string; lastMessage?: { body?: string }; unreadCount?: number };
      const title = c.title || "Conversation";
      return {
        id: String(c.id ?? ""),
        title,
        initials: initialsOf(title),
        lastBody: String(c.lastMessage?.body ?? ""),
        unread: Number(c.unreadCount ?? 0) > 0,
      };
    });
  },

  async start(userId: string): Promise<{ id: string }> {
    if (!isRealApiEnabled()) return dev({ id: `dev-conv-${Date.now()}` });
    const row = await apiFetch<{ id?: string }>(`/messages/conversations`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
    return { id: String(row.id ?? "") };
  },

  async thread(conversationId: string): Promise<ChatMessage[]> {
    if (!isRealApiEnabled()) return dev([]);
    const rows = await apiFetch<unknown[]>(`/messages/conversations/${conversationId}`);
    const list = Array.isArray(rows) ? rows : (rows as { messages?: unknown[] }).messages ?? [];
    return (Array.isArray(list) ? list : []).map((r) => {
      const m = r as { id?: string; body?: string; senderId?: string; createdAt?: string; mine?: boolean };
      return {
        id: String(m.id ?? ""),
        mine: Boolean(m.mine ?? false),
        body: String(m.body ?? ""),
        createdAt: String(m.createdAt ?? ""),
      };
    });
  },

  async send(conversationId: string, body: string): Promise<void> {
    if (!isRealApiEnabled()) return dev(undefined);
    await apiFetch(`/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  },
};
