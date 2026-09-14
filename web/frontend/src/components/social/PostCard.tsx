"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { socialService } from "@/lib/social/socialService";
import { isVideoPost, postOrientation, type SocialPost } from "@/lib/social/types";

// Reusable post renderer — official vs member identity is always explicit.
// Official: ASA PHIS Official badge. Member: @displayName.
// Inline interactions: like/save/share/repost/comment — no full page needed.
export function PostCard({ post }: { post: SocialPost }) {
  const queryClient = useQueryClient();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(Boolean(post.savedByMe));
  const [counts, setCounts] = useState({ likes: post.likeCount, comments: post.commentCount, reposts: post.repostCount, liked: post.likedByMe });

  const comments = useQuery({
    queryKey: ["post-comments", post.id],
    queryFn: () => socialService.getComments(post.id),
    enabled: commentsOpen,
  });

  const like = useMutation({
    mutationFn: () => socialService.toggleLike({ ...post, likedByMe: counts.liked, likeCount: counts.likes }),
    onSuccess: (r) => {
      setCounts((c) => ({ ...c, liked: r.liked, likes: r.likeCount }));
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });

  const comment = useMutation({
    mutationFn: () => socialService.addComment(post.id, draft),
    onSuccess: () => {
      setDraft("");
      comments.refetch();
      setCounts((c) => ({ ...c, comments: c.comments + 1 }));
    },
  });

  const repost = useMutation({
    mutationFn: () => socialService.repost(post.id),
    onSuccess: () => {
      setCounts((c) => ({ ...c, reposts: c.reposts + 1 }));
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
    },
  });

  const orientation = postOrientation(post);
  const official = post.author.isOfficial;

  return (
    <Card className="social-post-card" style={{ padding: 16, display: "grid", gap: 10 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <Avatar><AvatarFallback>{post.author.initials}</AvatarFallback></Avatar>
        <div style={{ display: "grid" }}>
          <span style={{ fontWeight: 600, display: "flex", gap: 6, alignItems: "center" }}>
            {official ? "ASA PHIS" : post.author.displayName}
            {official ? <Badge>Official ✓</Badge> : null}
          </span>
          <span style={{ fontSize: 12, opacity: 0.7 }}>
            {official ? "Official AsaPhis" : `@${post.author.displayName}`} · {new Date(post.createdAt).toLocaleDateString()}
            {post.group ? ` · ${post.group.name}` : ""}
          </span>
        </div>
        {post.status !== "PUBLISHED" ? <StatusBadge status={post.status} /> : null}
      </div>

      {post.origin ? (
        <div style={{ fontSize: 12, opacity: 0.8, borderLeft: "2px solid var(--border)", paddingLeft: 8 }}>
          Reposted from {post.origin.authorName}: {post.origin.body.slice(0, 140)}
        </div>
      ) : null}

      <p style={{ whiteSpace: "pre-wrap" }}>{post.body}</p>

      {isVideoPost(post) && post.mediaUrls.length > 0 ? (
        <div style={{ borderRadius: 8, overflow: "hidden", background: "#000" }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            src={post.mediaUrls[0]}
            poster={post.mediaUrls[1]}
            controls
            preload="metadata"
            playsInline
            style={orientation === "vertical" ? { width: "100%", maxHeight: 520, objectFit: "contain" } : { width: "100%", objectFit: "contain" }}
          />
        </div>
      ) : post.mediaUrls.length > 0 ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mediaUrls[0]} alt="" style={{ width: "100%", borderRadius: 8, objectFit: "cover" }} loading="lazy" />
      ) : null}

      {post.reviewerNote && post.status !== "PUBLISHED" ? (
        <p style={{ fontSize: 12, opacity: 0.8 }}>Moderation: {post.reviewerNote}</p>
      ) : null}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Button size="sm" variant={counts.liked ? "default" : "outline"} disabled={like.isPending} onClick={() => like.mutate()}>
          ❤️ {counts.likes}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setCommentsOpen((v) => !v)}>💬 {counts.comments}</Button>
        <Button size="sm" variant="outline" disabled={repost.isPending} onClick={() => repost.mutate()}>↗ {counts.reposts}</Button>
        <Button
          size="sm"
          variant={saved ? "default" : "outline"}
          onClick={() => {
            const next = socialService.toggleSave(post.id);
            setSaved(next);
          }}
        >
          🔖 {saved ? "Saved" : "Save"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const url = `${window.location.origin}/post/${post.id}`;
            void navigator.clipboard?.writeText(url).catch(() => null);
          }}
        >
          Share
        </Button>
      </div>

      {commentsOpen ? (
        <div style={{ display: "grid", gap: 8 }}>
          {(comments.data ?? []).map((c) => (
            <div key={c.id} style={{ fontSize: 13, borderTop: "1px solid var(--border)", paddingTop: 6 }}>
              <strong>{c.authorName}</strong> · <span style={{ opacity: 0.7 }}>{c.status}</span>
              <p>{c.body}</p>
            </div>
          ))}
          {comments.isLoading ? <p style={{ fontSize: 12 }}>Loading comments…</p> : null}
          <div style={{ display: "flex", gap: 8 }}>
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a thoughtful comment…" rows={2} />
            <Button size="sm" disabled={!draft.trim() || comment.isPending} onClick={() => comment.mutate()}>Reply</Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
