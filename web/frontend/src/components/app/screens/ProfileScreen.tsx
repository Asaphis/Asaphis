"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StateStrip } from "@/components/shared/StateStrip";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { createApi } from "@/lib/api/api-factory";
import { socialService } from "@/lib/social/socialService";
import { friendsService } from "@/lib/social/friendsService";
import { PostCard } from "@/components/social/PostCard";

// Profile: posts | friends | saved | settings.
// Old Security/Travel/Support/Contribute live under Settings — reorganized, not removed.
export function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const api = useMemo(() => createApi(), []);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("Posts");
  const [travel, setTravel] = useState({ destination: "Ghana", startDate: "", endDate: "", reason: "" });
  const [ticket, setTicket] = useState({ subject: "", message: "" });

  const profile = useQuery({ queryKey: ["member-profile"], queryFn: () => api.getMemberProfile() });
  const mine = useQuery({ queryKey: ["social-mine"], queryFn: () => socialService.getMine(), enabled: tab === "Posts" });
  const friends = useQuery({ queryKey: ["friends"], queryFn: () => friendsService.list(), enabled: tab === "Friends" });
  const requests = useQuery({ queryKey: ["friend-requests"], queryFn: () => friendsService.requests(), enabled: tab === "Friends" });
  const devices = useQuery({ queryKey: ["member-devices"], queryFn: () => api.listDevices(), enabled: tab === "Settings" });
  const sessions = useQuery({ queryKey: ["member-sessions"], queryFn: () => api.listSessions(), enabled: tab === "Settings" });
  const travelReqs = useQuery({ queryKey: ["member-travel"], queryFn: () => api.listTravelRequests(), enabled: tab === "Settings" });
  const tickets = useQuery({ queryKey: ["member-support"], queryFn: () => api.listSupportRequests(), enabled: tab === "Settings" });
  const feed = useQuery({ queryKey: ["social-feed"], queryFn: () => socialService.getFeed(null), staleTime: 60_000, enabled: tab === "Saved" });
  const savedPosts = (feed.data?.items ?? []).filter((p) => socialService.savedIds().includes(p.id));

  const accept = useMutation({
    mutationFn: (id: string) => friendsService.accept(id),
    onSettled: () => { queryClient.invalidateQueries({ queryKey: ["friend-requests"] }); queryClient.invalidateQueries({ queryKey: ["friends"] }); },
  });
  const createTravel = useMutation({
    mutationFn: () => api.createTravelRequest({ ...travel }),
    onSuccess: () => { setTravel({ destination: "Ghana", startDate: "", endDate: "", reason: "" }); queryClient.invalidateQueries({ queryKey: ["member-travel"] }); },
  });
  const createTicket = useMutation({
    mutationFn: () => api.createSupportRequest({ category: "Other", subject: ticket.subject, message: ticket.message }),
    onSuccess: () => { setTicket({ subject: "", message: "" }); queryClient.invalidateQueries({ queryKey: ["member-support"] }); },
  });

  const p = profile.data;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <Card style={{ padding: 16, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <Avatar><AvatarFallback>{p?.initials ?? "…"}</AvatarFallback></Avatar>
          <div>
            <h2 style={{ margin: 0 }}>{p?.name ?? "…"}</h2>
            <span style={{ fontSize: 12, opacity: 0.7 }}>
              {p?.memberId} · {p?.country} · {p ? <StatusBadge status={p.accountStatus === "active" ? "Active" : "Limited"} /> : null}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["Posts", "Friends", "Saved", "Settings"].map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t === "Friends" ? `Friends${requests.data?.length ? ` (${requests.data.length})` : ""}` : t}</Button>
          ))}
          <Button size="sm" variant="ghost" onClick={onLogout}>Log out</Button>
        </div>
      </Card>

      {tab === "Posts" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {mine.isLoading ? <StateStrip state="loading" message="Loading your posts…" /> : null}
          {!mine.isLoading && (mine.data ?? []).length === 0 ? <StateStrip state="empty" message="No posts yet. Create your first post from Home." /> : null}
          {(mine.data ?? []).map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      ) : null}

      {tab === "Friends" ? (
        <Card style={{ padding: 14, display: "grid", gap: 10 }}>
          <strong>Requests</strong>
          {(requests.data ?? []).map((r) => (
            <div key={r.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Avatar><AvatarFallback>{r.initials}</AvatarFallback></Avatar> {r.name}
              </span>
              <span style={{ display: "flex", gap: 6 }}>
                <Button size="sm" onClick={() => accept.mutate(r.id)}>Accept</Button>
                <Button size="sm" variant="outline" onClick={() => friendsService.decline(r.id).then(() => queryClient.invalidateQueries({ queryKey: ["friend-requests"] })}>Decline</Button>
              </span>
            </div>
          ))}
          {(requests.data ?? []).length === 0 ? <span style={{ fontSize: 13, opacity: 0.7 }}>No pending requests.</span> : null}
          <strong>Friends</strong>
          {(friends.data ?? []).map((f) => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Avatar><AvatarFallback>{f.initials}</AvatarFallback></Avatar> {f.name}
              </span>
              <Button size="sm" variant="ghost" onClick={() => friendsService.remove(f.id).then(() => queryClient.invalidateQueries({ queryKey: ["friends"] })}>Remove</Button>
            </div>
          ))}
          {(friends.data ?? []).length === 0 ? <span style={{ fontSize: 13, opacity: 0.7 }}>No friends yet. Find people in Discover.</span> : null}
        </Card>
      ) : null}

      {tab === "Saved" ? (
        <div style={{ display: "grid", gap: 10 }}>
          {savedPosts.length === 0 ? <StateStrip state="empty" message="Nothing saved yet." /> : null}
          {savedPosts.map((post) => <PostCard key={post.id} post={{ ...post, savedByMe: true }} />)}
        </div>
      ) : null}

      {tab === "Settings" ? (
        <div style={{ display: "grid", gap: 12 }}>
          <Card style={{ padding: 14, display: "grid", gap: 6 }}>
            <strong>Verification</strong>
            <span style={{ fontSize: 13 }}>Identity: {p?.identityVerified ? "verified" : "pending"} · Phone: {p?.phoneVerified ? "verified" : "pending"}</span>
          </Card>
          <Card style={{ padding: 14, display: "grid", gap: 6 }}>
            <strong>Devices & Sessions</strong>
            {(devices.data ?? []).map((d) => (
              <div key={d.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{d.label}<br /><span style={{ opacity: 0.7 }}>{d.detail}</span></span>
                <Button size="sm" variant="ghost" onClick={() => api.revokeDevice(d.id).then(() => queryClient.invalidateQueries({ queryKey: ["member-devices"] })}>Revoke</Button>
              </div>
            ))}
            {(sessions.data ?? []).map((s) => (
              <div key={s.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{s.label}<br /><span style={{ opacity: 0.7 }}>{s.detail}</span></span>
                <Button size="sm" variant="ghost" onClick={() => api.terminateSession(s.id).then(() => queryClient.invalidateQueries({ queryKey: ["member-sessions"] })}>End</Button>
              </div>
            ))}
          </Card>
          <Card style={{ padding: 14, display: "grid", gap: 8 }}>
            <strong>Travel Access — Profile → Settings → Travel</strong>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Input value={travel.destination} onChange={(e) => setTravel({ ...travel, destination: e.target.value })} placeholder="Destination" aria-label="Destination" style={{ maxWidth: 160 }} />
              <Input type="date" value={travel.startDate} onChange={(e) => setTravel({ ...travel, startDate: e.target.value })} aria-label="Start date" style={{ maxWidth: 160 }} />
              <Input type="date" value={travel.endDate} onChange={(e) => setTravel({ ...travel, endDate: e.target.value })} aria-label="End date" style={{ maxWidth: 160 }} />
            </div>
            <Input value={travel.reason} onChange={(e) => setTravel({ ...travel, reason: e.target.value })} placeholder="Reason" aria-label="Reason" />
            <div><Button size="sm" disabled={createTravel.isPending} onClick={() => createTravel.mutate()}>Request travel access</Button></div>
            {(travelReqs.data ?? []).map((t) => (
              <span key={t.id} style={{ fontSize: 13 }}>{t.destination} · {t.startDate} → {t.endDate} · <StatusBadge status={t.status} /></span>
            ))}
          </Card>
          <Card style={{ padding: 14, display: "grid", gap: 8 }}>
            <strong>Support — tickets, help, appeals</strong>
            <Input value={ticket.subject} onChange={(e) => setTicket({ ...ticket, subject: e.target.value })} placeholder="Subject" aria-label="Subject" />
            <Textarea value={ticket.message} onChange={(e) => setTicket({ ...ticket, message: e.target.value })} placeholder="How can we help?" rows={3} />
            <div><Button size="sm" disabled={createTicket.isPending} onClick={() => createTicket.mutate()}>Open ticket</Button></div>
            {(tickets.data ?? []).map((t) => (
              <span key={t.id} style={{ fontSize: 13 }}>{t.subject} · {t.status}</span>
            ))}
          </Card>
        </div>
      ) : null}
    </div>
  );
}
