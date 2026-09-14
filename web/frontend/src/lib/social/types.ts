// AsaPhis social-learning types. Backend: backend/src/modules/social/* + friends/messages/groups.
// One flexible Post system: TEXT | IMAGE | VIDEO | DOCUMENT | ARTICLE | LINK.
// Media/post model determines presentation (landscape player vs 9:16 vertical viewer).

export type PostMediaKind = "text" | "image" | "video" | "document" | "article" | "link";
export type PostStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "PUBLISHED"
  | "CHANGES_REQUIRED"
  | "REJECTED"
  | "HIDDEN"
  | "REMOVED"
  | "ARCHIVED";
export type PostVisibility = "PUBLIC" | "FRIENDS" | "GROUP" | "MEMBERS";

export interface PostAuthor {
  id: string;
  displayName: string;
  memberCode?: string;
  initials: string;
  isOfficial?: boolean;
}

export interface SocialPost {
  id: string;
  author: PostAuthor;
  group?: { id: string; name: string } | null;
  origin?: { id: string; body: string; authorName: string } | null;
  body: string;
  mediaUrls: string[];
  mediaKind: string;
  visibility: string;
  status: string;
  likeCount: number;
  commentCount: number;
  repostCount: number;
  likedByMe: boolean;
  savedByMe?: boolean;
  reviewerNote?: string | null;
  createdAt: string;
}

export interface PostComment {
  id: string;
  postId: string;
  parentId?: string | null;
  body: string;
  status: string;
  likeCount: number;
  createdAt: string;
  authorName: string;
}

export interface FeedPage {
  items: SocialPost[];
  nextCursor: string | null;
}

export function isVideoPost(p: SocialPost): boolean {
  if (p.mediaKind === "video") return true;
  return (p.mediaUrls ?? []).some((u) => /\.(mp4|webm|mov)(\?|$)/i.test(u));
}

export function isVerticalVideoUrl(url: string): boolean {
  return /portrait|vertical|9x16|9-16/i.test(url);
}

export function postOrientation(p: SocialPost): "vertical" | "landscape" | "none" {
  if (!isVideoPost(p)) return "none";
  const urls = p.mediaUrls ?? [];
  if (urls.some(isVerticalVideoUrl)) return "vertical";
  return "landscape";
}
