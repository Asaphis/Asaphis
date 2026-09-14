"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { socialService } from "@/lib/social/socialService";

// Simple composer — Create Post/Article/Video/Image/Document entry.
// Submits for review; user sees moderation state, never fake "Post successful".
export function Composer() {
  const queryClient = useQueryClient();
  const [body, setBody] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [notice, setNotice] = useState("");

  const create = useMutation({
    mutationFn: () =>
      socialService.createPost({
        body,
        mediaUrls: mediaUrl.trim() ? [mediaUrl.trim()] : [],
        mediaKind: mediaUrl.trim() ? (/\.mp4|\.webm|\.mov/i.test(mediaUrl) ? "video" : "image") : "text",
        visibility: "MEMBERS",
      }),
    onSuccess: (post) => {
      setBody("");
      setMediaUrl("");
      setNotice(post.status === "PUBLISHED" ? "Published to Home feed." : "Submitted for review. Track status in Profile → My Posts.");
      queryClient.invalidateQueries({ queryKey: ["social-feed"] });
      queryClient.invalidateQueries({ queryKey: ["social-mine"] });
    },
    onError: (e) => setNotice(e instanceof Error ? e.message : "Could not submit post."),
  });

  return (
    <Card style={{ padding: 16, display: "grid", gap: 10 }}>
      <strong>What&apos;s on your mind? Share knowledge with AsaPhis.</strong>
      <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Share history, culture, or a question worth keeping…" rows={3} />
      <input
        value={mediaUrl}
        onChange={(e) => setMediaUrl(e.target.value)}
        placeholder="Optional: photo/video/document URL"
        style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px" }}
      />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <Button size="sm" disabled={!body.trim() || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? "Submitting…" : "Submit for Review"}
        </Button>
        {notice ? <span style={{ fontSize: 12, opacity: 0.8 }}>{notice}</span> : null}
      </div>
    </Card>
  );
}
