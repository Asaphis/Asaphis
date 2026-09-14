// Development social adapter — only used when NEXT_PUBLIC_API_BASE_URL is empty.
// Production: socialService -> real backend /social/* -> Prisma Post/*.
// Do NOT import from components — use src/lib/social/socialService.
import type { FeedPage } from "@/lib/social/types";

export const developmentFeed: FeedPage = {
  items: [
    {
      id: "dev-official-1",
      author: { id: "asaphis", displayName: "AsaPhis", memberCode: "OFFICIAL", initials: "AP", isOfficial: true },
      group: null,
      origin: null,
      body: "The History of the Oyo Empire — how trade, scholarship and civic order built a lasting West African state. Full lesson in Learn.",
      mediaUrls: [],
      mediaKind: "article",
      visibility: "PUBLIC",
      status: "PUBLISHED",
      likeCount: 245,
      commentCount: 48,
      repostCount: 31,
      likedByMe: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "dev-member-1",
      author: { id: "dev-amara", displayName: "Amara Okafor", memberCode: "MEM-NG-240918", initials: "AO" },
      group: null,
      origin: null,
      body: "Something I learned about Benin bronze casting this week — the guild system kept technique and history together. What sources do you trust on this?",
      mediaUrls: [],
      mediaKind: "text",
      visibility: "MEMBERS",
      status: "PUBLISHED",
      likeCount: 82,
      commentCount: 14,
      repostCount: 7,
      likedByMe: false,
      createdAt: new Date().toISOString(),
    },
  ],
  nextCursor: null,
};
