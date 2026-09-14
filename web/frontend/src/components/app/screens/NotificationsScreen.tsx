"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StateStrip } from "@/components/shared/StateStrip";
import { createApi } from "@/lib/api/api-factory";

// Social / System / Security segments. Security alerts stay visually distinct.
export function NotificationsScreen() {
  const api = useMemo(() => createApi(), []);
  const [segment, setSegment] = useState("All");

  const list = useQuery({ queryKey: ["notifications", segment], queryFn: () => api.getNotifications() });

  const items = (list.data ?? []).filter((n) => {
    if (segment === "All") return true;
    if (segment === "Security") return n.category === "Security";
    if (segment === "Social") return ["Community", "Moderation", "Account"].includes(n.category);
    return !["Security", "Community", "Moderation", "Account"].includes(n.category);
  });

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["All", "Social", "System", "Security"].map((s) => (
          <Button key={s} size="sm" variant={segment === s ? "default" : "outline"} onClick={() => setSegment(s)}>{s}</Button>
        ))}
      </div>
      <Card style={{ padding: 12, display: "grid", gap: 8 }}>
        {list.isLoading ? <StateStrip state="loading" message="Loading notifications…" /> : null}
        {list.isError ? <StateStrip state="error" message="Notifications failed to load." onRetry={() => list.refetch()} /> : null}
        {!list.isLoading && items.length === 0 ? <StateStrip state="empty" message="You're all caught up." /> : null}
        {items.map((n) => (
          <div key={n.id} style={{ borderLeft: n.category === "Security" ? "3px solid #9e3f38" : "3px solid transparent", paddingLeft: 8, display: "grid", gap: 2 }}>
            <span style={{ fontSize: 12, opacity: 0.7 }}>{n.category} · {n.createdAt}</span>
            <strong>{n.title}</strong>
            <span style={{ fontSize: 13, opacity: 0.85 }}>{n.body}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
