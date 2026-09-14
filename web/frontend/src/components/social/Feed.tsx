"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { StateStrip } from "@/components/shared/StateStrip";
import { socialService } from "@/lib/social/socialService";
import { PostCard } from "@/components/social/PostCard";
import { Composer } from "@/components/social/Composer";

// HOME = social feed. Tabs: For You | Following | Latest.
// V1 ranking: approved + published + recent (+ following filter client-side).
// No AI ranking yet — do not block MVP on recommendation algorithm.
export function Feed() {
  const feed = useInfiniteQuery({
    queryKey: ["social-feed"],
    queryFn: ({ pageParam }: { pageParam?: string | null }) => socialService.getFeed(pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
  });

  const items = (feed.data?.pages ?? []).flatMap((p) => p.items);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Composer />
      {feed.isLoading ? <StateStrip state="loading" message="Loading Home feed…" /> : null}
      {feed.isError ? <StateStrip state="error" message="Feed failed to load." onRetry={() => feed.refetch()} /> : null}
      {!feed.isLoading && items.length === 0 ? <StateStrip state="empty" message="No posts yet. Create the first one above." /> : null}
      {items.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {feed.hasNextPage ? (
        <Button variant="outline" disabled={feed.isFetchingNextPage} onClick={() => feed.fetchNextPage()}>
          {feed.isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      ) : null}
    </div>
  );
}
