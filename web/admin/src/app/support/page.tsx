"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { DetailDrawer, DetailRow, QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate, type SupportTicket } from "@/lib/admin-types";

const tabs = ["All", "open", "waiting", "in-progress", "resolved", "closed"];
const label = (v: string) => v.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");

export default function SupportPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("All");
  const [open, setOpen] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState("");

  const query = useQuery({ queryKey: ["admin-support", status], queryFn: () => api.listTickets(status) });

  const send = useMutation({
    mutationFn: () => api.replyTicket(open!.id, reply),
    onSuccess: (next) => {
      setOpen(next);
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["admin-support"] });
    },
  });

  const setTicketStatus = useMutation({
    mutationFn: (s: SupportTicket["status"]) => api.updateTicketStatus(open!.id, s),
    onSuccess: (next) => {
      setOpen(next);
      queryClient.invalidateQueries({ queryKey: ["admin-support"] });
    },
  });

  return (
    <AdminShell title="Support" subtitle="Tickets with member context, priority, messages, and resolution.">
      <SectionCard title="Ticket queue">
        <div className="admin-tabs" role="tablist" aria-label="Ticket status">
          {tabs.map((t) => (
            <button key={t} type="button" role="tab" aria-selected={status === t} className={status === t ? "is-active" : ""} onClick={() => setStatus(t)}>{t === "All" ? "All" : label(t)}</button>
          ))}
        </div>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data || query.data.length === 0} emptyText="No tickets in this state." onRetry={() => query.refetch()}>
          <div className="admin-table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data ?? []).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell><span className="admin-row-main">{t.subject}</span><span className="admin-row-sub">{t.id} · {t.category} · {formatAdminDate(t.updatedAt)}</span></TableCell>
                    <TableCell><span className="admin-row-sub">{t.memberName} · {t.memberId}</span></TableCell>
                    <TableCell><StatusBadge status={t.priority[0].toUpperCase() + t.priority.slice(1)} /></TableCell>
                    <TableCell><StatusBadge status={label(t.status)} /></TableCell>
                    <TableCell className="text-right"><button type="button" className="admin-link-btn" onClick={() => setOpen(t)}>Open</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </QueryState>
      </SectionCard>
      {open ? (
        <DetailDrawer title={open.subject} subtitle={`${open.id} · ${open.memberName} · ${open.memberId}`} onClose={() => setOpen(null)}>
          <DetailRow label="Category"><span>{open.category}</span></DetailRow>
          <DetailRow label="Priority"><StatusBadge status={open.priority[0].toUpperCase() + open.priority.slice(1)} /></DetailRow>
          <DetailRow label="Status"><StatusBadge status={label(open.status)} /></DetailRow>
          <div className="admin-timeline" style={{ marginTop: 12 }}>
            {open.messages.map((m, i) => (
              <div key={i} className="admin-timeline-item"><strong>{m.author}</strong><p style={{ margin: "4px 0", fontSize: 12 }}>{m.body}</p><span>{formatAdminDate(m.at)}</span></div>
            ))}
          </div>
          <div className="form-field" style={{ marginTop: 14 }}>
            <Textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply…" aria-label="Reply to ticket" />
          </div>
          <div className="admin-toolbar" style={{ marginTop: 10 }}>
            <Button type="button" disabled={!reply.trim() || send.isPending} onClick={() => send.mutate()}>Send reply</Button>
            <Button type="button" variant="outline" onClick={() => setTicketStatus.mutate("resolved")}>Resolve</Button>
            <Button type="button" variant="ghost" onClick={() => setTicketStatus.mutate("closed")}>Close</Button>
          </div>
        </DetailDrawer>
      ) : null}
    </AdminShell>
  );
}
