"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateStrip } from "@/components/shared/StateStrip";
import { friendsService } from "@/lib/social/friendsService";
import { communitiesService } from "@/lib/social/communitiesService";
import { socialService } from "@/lib/social/socialService";
import { PostCard } from "@/components/social/PostCard";

const TRENDING = ["African History", "Yoruba History", "Ancient Civilizations", "African Culture"];

// Discover people, posts, videos, articles, communities, topics — not just people.
export function DiscoverScreen({ search }: { search: string }) {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("All");

  const people = useQuery({ queryKey: ["discover-people", search], queryFn: () => friendsService.search(search), enabled: search.trim().length > 0 });
  const communities = useQuery({ queryKey: ["discover-communities"], queryFn: () => communitiesService.list() });
  const feed = useQuery({ queryKey: ["social-feed"], queryFn: () => socialService.getFeed(null), staleTime: 60_000 });

  const request = useMutation({
    mutationFn: (id: string) => friendsService.request(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["discover-people"] }),
  });

  const join = useMutation({
    mutationFn: (id: string) => communitiesService.join(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["discover-communities"] }),
  });

  const videos = (feed.data?.items ?? []).filter((p) => p.mediaKind === "video" || p.mediaUrls.some((u) => /\.mp4|\.webm|\.mov/i.test(u)));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["All", "People", "Posts", "Videos", "Communities"].map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>

      <Card style={{ padding: 14, display: "grid", gap: 8 }}>
        <strong>Trending Topics</strong>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TRENDING.map((t) => (
            <Button key={t} size="sm" variant="outline">#{t}</Button>
          ))}
        </div>
      </Card>

      {(tab === "All" || tab === "People") && search.trim() ? (
        <Card style={{ padding: 14, display: "grid", gap: 8 }}>
          <strong>People</strong>
          {people.isLoading ? <StateStrip state="loading" message="Searching people…" /> : null}
          {(people.data ?? []).map((p) => (
            <div key={p.id} style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Avatar><AvatarFallback>{p.initials}</AvatarFallback></Avatar> {p.name}
              </span>
              <span style={{ display: "flex", gap: 6 }}>
                <Button size="sm" variant="outline" disabled={request.isPending} onClick={() => request.mutate(p.id)}>Add Friend</Button>
              </span>
            </div>
          ))}
          {people.data?.length === 0 ? <span style={{ fontSize: 13, opacity: 0.7 }}>No people found.</span> : null}
        </Card>
      ) : null}

      {(tab === "All" || tab === "Videos") && videos.length > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          <strong>Educational Videos</strong>
          {videos.slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      ) : null}

      {(tab === "All" || tab === "Posts") && (feed.data?.items?.length ?? 0) > 0 ? (
        <div style={{ display: "grid", gap: 10 }}>
          <strong>Posts</strong>
          {(feed.data?.items ?? []).slice(0, 3).map((p) => <PostCard key={p.id} post={p} />)}
        </div>
      ) : null}

      {(tab === "All" || tab === "Communities") ? (
        <Card style={{ padding: 14, display: "grid", gap: 8 }}>
          <strong>Communities</strong>
          {communities.isLoading ? <StateStrip state="loading" message="Loading communities…" /> : null}
          {(communities.data ?? []).slice(0, 5).map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between" }}>
              <span><strong>{c.name}</strong><br /><span style={{ fontSize: 12, opacity: 0.7 }}>{c.memberCount} members</span></span>
              <Button size="sm" variant="outline" disabled={c.joined || join.isPending} onClick={() => join.mutate(c.id)}>
                {c.joined ? "Joined" : "Join"}
              </Button>
            </div>
          ))}
          {communities.data?.length === 0 ? <span style={{ fontSize: 13, opacity: 0.7 }}>No communities yet.</span> : null}
        </Card>
      ) : null}
    </div>
  );
}
