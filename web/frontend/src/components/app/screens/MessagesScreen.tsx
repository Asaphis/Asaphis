"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { StateStrip } from "@/components/shared/StateStrip";
import { messagesService } from "@/lib/social/messagesService";

// Conversation list + thread. Requests/blocks/reports enforced by backend.
export function MessagesScreen() {
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const convos = useQuery({ queryKey: ["conversations"], queryFn: () => messagesService.conversations() });
  const thread = useQuery({
    queryKey: ["thread", activeId],
    queryFn: () => messagesService.thread(activeId!),
    enabled: Boolean(activeId),
    refetchInterval: 8000,
  });

  const send = useMutation({
    mutationFn: () => messagesService.send(activeId!, draft),
    onSuccess: () => {
      setDraft("");
      queryClient.invalidateQueries({ queryKey: ["thread", activeId] });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  return (
    <div className="messages-layout" style={{ display: "grid", gap: 12, gridTemplateColumns: "minmax(220px, 300px) 1fr" }}>
      <Card style={{ padding: 12, display: "grid", gap: 8, alignContent: "start" }}>
        <strong>Conversations</strong>
        {convos.isLoading ? <StateStrip state="loading" message="Loading…" /> : null}
        {(convos.data ?? []).map((c) => (
          <Button key={c.id} variant={activeId === c.id ? "default" : "ghost"} onClick={() => setActiveId(c.id)} style={{ justifyContent: "flex-start" }}>
            <Avatar><AvatarFallback>{c.initials}</AvatarFallback></Avatar>
            <span style={{ textAlign: "left" }}><strong>{c.title}</strong><br /><span style={{ fontSize: 12, opacity: 0.7 }}>{c.lastBody.slice(0, 40)}</span></span>
            {c.unread ? <span className="social-dot">•</span> : null}
          </Button>
        ))}
        {!convos.isLoading && (convos.data ?? []).length === 0 ? (
          <span style={{ fontSize: 13, opacity: 0.7 }}>No conversations. Add a friend, then message from their profile.</span>
        ) : null}
      </Card>

      <Card style={{ padding: 12, display: "grid", gap: 8, alignContent: "start", minHeight: 300 }}>
        {!activeId ? <span style={{ fontSize: 13, opacity: 0.7 }}>Pick a conversation.</span> : null}
        {(thread.data ?? []).map((m) => (
          <div key={m.id} style={{ justifySelf: m.mine ? "end" : "start", background: m.mine ? "var(--primary)" : "var(--muted)", color: m.mine ? "white" : "inherit", borderRadius: 12, padding: "8px 12px", maxWidth: "80%" }}>
            {m.body}
          </div>
        ))}
        {activeId ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" rows={2} />
            <Button size="sm" disabled={!draft.trim() || send.isPending} onClick={() => send.mutate()}>Send</Button>
          </div>
        ) : null}
      </Card>
    </div>
  );
}
