"use client";

import { useState } from "react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StateStrip } from "@/components/shared/StateStrip";
import { createApi } from "@/lib/api/api-factory";
import { PostCard } from "@/components/social/PostCard";
import { socialService } from "@/lib/social/socialService";

// Learn: Featured · Articles · Videos · Documents · Saved.
// Old Education/Videos/Documents/Updates tabs merged here — nothing deleted.
export function LearnScreen() {
  const api = useMemo(() => createApi(), []);
  const [tab, setTab] = useState("Featured");
  const [search, setSearch] = useState("");

  const education = useQuery({ queryKey: ["learn-education", search], queryFn: () => api.getEducation({ search }) });
  const videos = useQuery({ queryKey: ["learn-videos"], queryFn: () => api.getVideos(), enabled: tab === "Videos" || tab === "Featured" });
  const documents = useQuery({ queryKey: ["learn-documents"], queryFn: () => api.getDocuments(), enabled: tab === "Documents" });
  const feed = useQuery({ queryKey: ["social-feed"], queryFn: () => socialService.getFeed(null), staleTime: 60_000 });
  const savedIds = socialService.savedIds();
  const savedPosts = (feed.data?.items ?? []).filter((p) => savedIds.includes(p.id));

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["Featured", "Articles", "Videos", "Documents", "Saved"].map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>
      <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search learning…" aria-label="Search learning" />

      {(tab === "Featured" || tab === "Articles") ? (
        <div style={{ display: "grid", gap: 10 }}>
          {education.isLoading ? <StateStrip state="loading" message="Loading lessons…" /> : null}
          {(education.data ?? []).slice(0, tab === "Featured" ? 4 : 20).map((r) => (
            <Card key={r.id} style={{ padding: 14, display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>{r.category} · {r.kind}</span>
              <strong>{r.title}</strong>
              <span style={{ fontSize: 13, opacity: 0.8 }}>{r.description}</span>
            </Card>
          ))}
          {!education.isLoading && (education.data ?? []).length === 0 ? <StateStrip state="empty" message="No lessons found." /> : null}
        </div>
      ) : null}

      {tab === "Videos" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {(videos.data ?? []).map((v) => (
            <Card key={v.id} style={{ padding: 14, display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>{v.kind}{v.durationMinutes ? ` · ${v.durationMinutes} min` : ""}</span>
              <strong>{v.title}</strong>
              <span style={{ fontSize: 13, opacity: 0.8 }}>{v.description}</span>
            </Card>
          ))}
          {!videos.isLoading && (videos.data ?? []).length === 0 ? <StateStrip state="empty" message="No videos yet." /> : null}
        </div>
      ) : null}

      {tab === "Documents" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {(documents.data ?? []).map((d) => (
            <Card key={d.id} style={{ padding: 14, display: "grid", gap: 6 }}>
              <span style={{ fontSize: 12, opacity: 0.7 }}>{d.category} · {d.fileType}</span>
              <strong>{d.title}</strong>
              <span style={{ fontSize: 13, opacity: 0.8 }}>{d.description}</span>
            </Card>
          ))}
          {!documents.isLoading && (documents.data ?? []).length === 0 ? <StateStrip state="empty" message="No documents yet." /> : null}
        </div>
      ) : null}

      {tab === "Saved" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {savedPosts.length === 0 ? <StateStrip state="empty" message="Nothing saved yet. Tap Save on any post." /> : null}
          {savedPosts.map((p) => <PostCard key={p.id} post={{ ...p, savedByMe: true }} />)}
        </div>
      ) : null}
    </div>
  );
}
