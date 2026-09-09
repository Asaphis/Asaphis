"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { FilterSelect, QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate } from "@/lib/admin-types";

const audiences = ["All members", "Nigeria", "Ghana", "Kenya", "Trusted members", "Specific users"];
const channels = ["In-app", "Push", "Both"];

export default function NotificationsPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState(audiences[0]);
  const [channel, setChannel] = useState(channels[0]);
  const [scheduledFor, setScheduledFor] = useState("");

  const query = useQuery({ queryKey: ["admin-notifications"], queryFn: () => api.listNotifications() });

  const create = useMutation({
    mutationFn: () => api.createNotification({ title, body, audience, channel, scheduledFor: scheduledFor || undefined }),
    onSuccess: () => {
      setTitle("");
      setBody("");
      setScheduledFor("");
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
  });

  return (
    <AdminShell title="Notifications" subtitle="Announcements, push, and in-app messages with targeting and history.">
      <div className="admin-two-col">
        <SectionCard title="Create notification">
          <div className="form-field">
            <Label htmlFor="nt-title">Title</Label>
            <Input id="nt-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What should members know?" />
          </div>
          <div className="form-field">
            <Label htmlFor="nt-body">Message</Label>
            <Textarea id="nt-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Keep it short and useful." />
          </div>
          <div className="admin-toolbar" style={{ marginTop: 10 }}>
            <FilterSelect label="Audience" value={audience} onChange={setAudience} options={audiences} />
            <FilterSelect label="Channel" value={channel} onChange={setChannel} options={channels} />
          </div>
          <div className="form-field">
            <Label htmlFor="nt-when">Schedule (optional)</Label>
            <Input id="nt-when" type="date" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
          </div>
          <Button type="button" style={{ marginTop: 12 }} disabled={!title.trim() || !body.trim() || create.isPending} onClick={() => create.mutate()}>
            {scheduledFor ? "Schedule notification" : "Send now"}
          </Button>
        </SectionCard>
        <SectionCard title="History" intro="Every broadcast is recorded.">
          <QueryState loading={query.isLoading} error={query.error} empty={!query.data || query.data.length === 0} emptyText="No notifications yet." onRetry={() => query.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(query.data ?? []).map((n) => (
                    <TableRow key={n.id}>
                      <TableCell>
                        <span className="admin-row-main">{n.title}</span>
                        <span className="admin-row-sub">{n.audience} · {n.channel} · {n.sentAt ? formatAdminDate(n.sentAt) : n.scheduledFor ? `Scheduled ${n.scheduledFor}` : "Draft"} · {n.createdBy}</span>
                      </TableCell>
                      <TableCell><StatusBadge status={n.status[0].toUpperCase() + n.status.slice(1)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      </div>
    </AdminShell>
  );
}
