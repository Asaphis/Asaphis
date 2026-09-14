"use client";

import { useEffect, useRef } from "react";
import type { SocialPost } from "@/lib/social/types";
import { PostCard } from "@/components/social/PostCard";

// Two experiences, same post model:
// - Landscape/long video: normal player inside PostCard.
// - Short 9:16 video: immersive vertical viewer with swipe, autoplay-when-visible,
//   pause offscreen, lazy poster, like/comment/share/save/report inline.
export function VerticalVideoFeed({ posts }: { posts: SocialPost[] }) {
  const refs = useRef(new Map<string, HTMLVideoElement>());

  useEffect(() => {
    const videos = [...refs.current.values()];
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const v = e.target as HTMLVideoElement;
          if (e.isIntersecting && e.intersectionRatio > 0.6) void v.play().catch(() => null);
          else v.pause();
        }
      },
      { threshold: [0.6] },
    );
    videos.forEach((v) => io.observe(v));
    return () => io.disconnect();
  }, [posts.length]);

  const verticals = posts.filter((p) => (p.mediaUrls ?? []).length > 0);

  return (
    <div style={{ display: "grid", gap: 16, scrollSnapType: "y mandatory" }}>
      {verticals.map((p) => (
        <div key={p.id} style={{ scrollSnapAlign: "start", display: "grid", gap: 8 }}>
          <div style={{ position: "relative", background: "#000", borderRadius: 12, overflow: "hidden", maxHeight: 640 }}>
            {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
            <video
              ref={(el) => {
                if (el) refs.current.set(p.id, el);
                else refs.current.delete(p.id);
              }}
              src={p.mediaUrls[0]}
              poster={p.mediaUrls[1]}
              controls
              muted
              loop
              playsInline
              preload="metadata"
              style={{ width: "100%", maxHeight: 560, objectFit: "contain" }}
            />
          </div>
          <PostCard post={p} />
        </div>
      ))}
      {verticals.length === 0 ? <p style={{ fontSize: 13, opacity: 0.7 }}>No videos yet.</p> : null}
    </div>
  );
}
