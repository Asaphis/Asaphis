"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { StateStrip } from "@/components/shared/StateStrip";
import { communitiesService } from "@/lib/social/communitiesService";

// My Communities / Discover / Create. Creation goes through moderation;
// platform admins keep top authority over community moderators.
export function CommunitiesScreen() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("Mine");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notice, setNotice] = useState("");

  const groups = useQuery({ queryKey: ["communities"], queryFn: () => communitiesService.list() });
  const mine = (groups.data ?? []).filter((g) => g.joined);
  const discover = (groups.data ?? []).filter((g) => !g.joined);

  const join = useMutation({
    mutationFn: (id: string) => communitiesService.join(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });
  const leave = useMutation({
    mutationFn: (id: string) => communitiesService.leave(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["communities"] }),
  });
  const create = useMutation({
    mutationFn: () => communitiesService.create({ name, description, isOpen: true }),
    onSuccess: () => {
      setName("");
      setDescription("");
      setNotice("Submitted for moderation. It appears here once approved.");
      setTab("Mine");
      queryClient.invalidateQueries({ queryKey: ["communities"] });
    },
    onError: (e) => setNotice(e instanceof Error ? e.message : "Could not create community."),
  });

  const list = tab === "Mine" ? mine : discover;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        {["Mine", "Discover", "Create"].map((t) => (
          <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} onClick={() => setTab(t)}>{t}</Button>
        ))}
      </div>

      {tab === "Create" ? (
        <Card style={{ padding: 16, display: "grid", gap: 10 }}>
          <strong>Create Community</strong>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" aria-label="Community name" />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description and rules" rows={4} />
          <div>
            <Button size="sm" disabled={!name.trim() || create.isPending} onClick={() => create.mutate()}>
              {create.isPending ? "Submitting…" : "Submit for Review"}
            </Button>
            {notice ? <p style={{ fontSize: 12, opacity: 0.8 }}>{notice}</p> : null}
          </div>
        </Card>
      ) : (
        <Card style={{ padding: 14, display: "grid", gap: 10 }}>
          {groups.isLoading ? <StateStrip state="loading" message="Loading communities…" /> : null}
          {groups.isError ? <StateStrip state="error" message="Communities failed to load." onRetry={() => groups.refetch()} /> : null}
          {!groups.isLoading && list.length === 0 ? (
            <StateStrip state="empty" message={tab === "Mine" ? "You have not joined any community yet." : "No new communities to discover."} />
          ) : null}
          {list.map((c) => (
            <div key={c.id} style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
              <span><strong>{c.name}</strong><br /><span style={{ fontSize: 12, opacity: 0.7 }}>{c.description.slice(0, 100)} · {c.memberCount} members</span></span>
              {c.joined ? (
                <Button size="sm" variant="outline" disabled={leave.isPending} onClick={() => leave.mutate(c.id)}>Leave</Button>
              ) : (
                <Button size="sm" variant="outline" disabled={join.isPending} onClick={() => join.mutate(c.id)}>Join</Button>
              )}
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}
