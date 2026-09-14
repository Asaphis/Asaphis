import { apiFetch, isRealApiEnabled } from "@/lib/api/http-client";
import { developmentFeed } from "../../../../data/development/social";
import type { FeedPage, PostComment, SocialPost } from "@/lib/social/types";

// Social service abstraction — UI -> hooks -> socialService -> backend.
// Backend: GET/POST /social/feed, /social/posts, likes, comments, repost, reports.
// Dev (no API base): development adapter so Home feed renders before backend integration.
async function dev<T>(value: T, delay = 200): Promise<T> {
  await new Promise((r) => setTimeout(r, delay));
  return value;
}

const SAVED_KEY = "asaphis-saved-posts";
function localSaved(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(SAVED_KEY) ?? "[]") as string[];
  } catch {
    return [];
  }
}

export const socialService = {
  async getFeed(cursor?: string | null): Promise<FeedPage> {
    if (!isRealApiEnabled()) {
      const saved = new Set(localSaved());
      return dev({ items: developmentFeed.items.map((p) => ({ ...p, savedByMe: saved.has(p.id) })), nextCursor: null });
    }
    const q = cursor ? `?cursor=${encodeURIComponent(cursor)}` : "";
    const page = await apiFetch<FeedPage>(`/social/feed${q}`);
    const saved = new Set(localSaved());
    return { items: page.items.map((p) => ({ ...p, savedByMe: saved.has(p.id) })), nextCursor: page.nextCursor };
  },

  async getMine(): Promise<SocialPost[]> {
    if (!isRealApiEnabled()) return dev([]);
    return apiFetch<SocialPost[]>("/social/posts/mine");
  },

  async createPost(input: { body: string; mediaUrls?: string[]; mediaKind?: string; visibility?: string; groupId?: string }): Promise<SocialPost> {
    if (!isRealApiEnabled()) {
      return dev({
        id: `dev-${Date.now()}`, author: { id: "me", displayName: "You", initials: "YO" },
        group: null, origin: null, body: input.body, mediaUrls: input.mediaUrls ?? [],
        mediaKind: input.mediaKind ?? "text", visibility: input.visibility ?? "MEMBERS",
        status: "UNDER_REVIEW", likeCount: 0, commentCount: 0, repostCount: 0,
        likedByMe: false, createdAt: new Date().toISOString(),
      });
    }
    return apiFetch<SocialPost>("/social/posts", { method: "POST", body: JSON.stringify(input) });
  },

  async toggleLike(post: SocialPost): Promise<{ liked: boolean; likeCount: number }> {
    if (!isRealApiEnabled()) return dev({ liked: !post.likedByMe, likeCount: post.likeCount + (post.likedByMe ? -1 : 1) });
    if (post.likedByMe) return apiFetch(`/social/posts/${post.id}/like`, { method: "DELETE" });
    return apiFetch(`/social/posts/${post.id}/like`, { method: "POST" });
  },

  async getComments(postId: string): Promise<PostComment[]> {
    if (!isRealApiEnabled()) return dev([]);
    return apiFetch<PostComment[]>(`/social/posts/${postId}/comments`);
  },

  async addComment(postId: string, body: string, parentId?: string): Promise<{ id: string; status: string }> {
    if (!isRealApiEnabled()) return dev({ id: `dev-c-${Date.now()}`, status: "approved" });
    return apiFetch(`/social/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ body, parentId }) });
  },

  async repost(postId: string, body?: string): Promise<SocialPost> {
    if (!isRealApiEnabled()) return dev({ ...(developmentFeed.items[0]), id: `dev-re-${Date.now()}`, body: body ?? "" });
    return apiFetch<SocialPost>(`/social/posts/${postId}/repost`, { method: "POST", body: JSON.stringify({ body: body ?? "" }) });
  },

  async report(targetKind: string, targetId: string, reason: string, details?: string): Promise<{ id: string }> {
    if (!isRealApiEnabled()) return dev({ id: `dev-report-${Date.now()}` });
    return apiFetch(`/social/reports`, { method: "POST", body: JSON.stringify({ targetKind, targetId, reason, details }) });
  },

  // Saved is local-first until SavedPost model lands (see backend gap list).
  // Same post model determines presentation — no separate TikTok system.
  toggleSave(postId: string): boolean {
    const saved = new Set(localSaved());
    if (saved.has(postId)) saved.delete(postId);
    else saved.add(postId);
    try {
      window.localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
    } catch {
      // ignore
    }
    return saved.has(postId);
  },

  savedIds(): string[] {
    return localSaved();
  },
};
