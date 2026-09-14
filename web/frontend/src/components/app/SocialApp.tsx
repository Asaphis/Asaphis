"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { createApi } from "@/lib/api/api-factory";
import type { AsaPhisApi } from "@/lib/api/contracts";
import { AppShell, type AppTab } from "@/components/app/AppShell";
import { Feed } from "@/components/social/Feed";
import { Composer } from "@/components/social/Composer";
import { DiscoverScreen } from "@/components/app/screens/DiscoverScreen";
import { CommunitiesScreen } from "@/components/app/screens/CommunitiesScreen";
import { MessagesScreen } from "@/components/app/screens/MessagesScreen";
import { LearnScreen } from "@/components/app/screens/LearnScreen";
import { NotificationsScreen } from "@/components/app/screens/NotificationsScreen";
import { ProfileScreen } from "@/components/app/screens/ProfileScreen";
import { communitiesService } from "@/lib/social/communitiesService";
import { friendsService } from "@/lib/social/friendsService";

// Clean post-login app. Replaces the old 12-tab dashboard file.
// Auth, API contracts, verification, travel, support all reused untouched.
export function SocialApp({ api: apiProp, onPublic, onLogout }: { api?: AsaPhisApi; onPublic: () => void; onLogout: () => void }) {
  const api = useMemo(() => apiProp ?? createApi(), [apiProp]);
  const [tab, setTab] = useState<AppTab>("home");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const profile = useQuery({ queryKey: ["member-profile"], queryFn: () => api.getMemberProfile() });
  const notifications = useQuery({ queryKey: ["notifications", "All"], queryFn: () => api.getNotifications() });
  const suggestions = useQuery({ queryKey: ["suggested-people"], queryFn: () => friendsService.search("a") });
  const myCommunities = useQuery({ queryKey: ["communities"], queryFn: () => communitiesService.list() });

  const unreadNotifications = (notifications.data ?? []).filter((n) => !n.read).length;
  const initials = (profile.data?.initials ?? "ME").slice(0, 2).toUpperCase();

  const onSearch = (q: string) => {
    setSearch(q);
    if (q.trim()) setTab("discover");
  };

  return (
    <AppShell
      tab={tab}
      onTab={setTab}
      onCreate={() => setCreateOpen(true)}
      onSearch={onSearch}
      search={search}
      unreadMessages={0}
      unreadNotifications={unreadNotifications}
      initials={initials}
      rightRail={
        <div style={{ display: "grid", gap: 12 }}>
          <Card style={{ padding: 14, display: "grid", gap: 8 }}>
            <strong>Suggested People</strong>
            {(suggestions.data ?? []).slice(0, 3).map((p) => (
              <div key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                <span>{p.name}</span>
                <Button size="sm" variant="outline" onClick={() => friendsService.request(p.id)}>Add</Button>
              </div>
            ))}
            {(suggestions.data ?? []).length === 0 ? <span style={{ fontSize: 12, opacity: 0.7 }}>Search Discover to find people.</span> : null}
          </Card>
          <Card style={{ padding: 14, display: "grid", gap: 8 }}>
            <strong>My Communities</strong>
            {(myCommunities.data ?? []).filter((c) => c.joined).slice(0, 4).map((c) => (
              <Button key={c.id} size="sm" variant="ghost" style={{ justifyContent: "flex-start" }} onClick={() => setTab("communities")}>{c.name}</Button>
            ))}
            {(myCommunities.data ?? []).filter((c) => c.joined).length === 0 ? (
              <span style={{ fontSize: 12, opacity: 0.7 }}>No communities yet.</span>
            ) : null}
          </Card>
          <Card style={{ padding: 14, display: "grid", gap: 6 }}>
            <strong>Official</strong>
            <span style={{ fontSize: 12, opacity: 0.75 }}>ASA PHIS ✓ announcements appear in Home with the official badge.</span>
            <Button size="sm" variant="outline" onClick={onPublic}>View public site</Button>
          </Card>
        </div>
      }
    >
      {tab === "home" ? <Feed /> : null}
      {tab === "discover" ? <DiscoverScreen search={search} /> : null}
      {tab === "communities" ? <CommunitiesScreen /> : null}
      {tab === "messages" ? <MessagesScreen /> : null}
      {tab === "learn" ? <LearnScreen /> : null}
      {tab === "notifications" ? <NotificationsScreen /> : null}
      {tab === "profile" ? <ProfileScreen onLogout={onLogout} /> : null}

      {createOpen ? (
        <div className="social-sheet-overlay" role="dialog" aria-modal="true" aria-label="Create" onClick={() => setCreateOpen(false)}>
          <div className="social-sheet" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Create</strong>
              <Button size="sm" variant="outline" onClick={() => setCreateOpen(false)}>Close</Button>
            </div>
            <Composer />
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

