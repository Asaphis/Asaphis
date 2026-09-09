"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDialog, DetailDrawer, DetailRow, NoteForm, QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate, submissionStatusLabels, type Submission } from "@/lib/admin-types";

const queueTabs = ["All", "pending", "under-review", "changes-requested", "approved", "rejected", "scheduled", "published"];
const commentTabs = ["All", "pending", "approved", "flagged"];
const areaTabs = ["Submissions", "Comments"];

export default function ModerationPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [area, setArea] = useState("Submissions");
  const [status, setStatus] = useState("All");
  const [commentFilter, setCommentFilter] = useState("All");
  const [open, setOpen] = useState<Submission | null>(null);
  const [confirm, setConfirm] = useState<{ action: "approve" | "reject" | "request-changes" | "schedule" | "publish"; label: string; danger?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  const subs = useQuery({ queryKey: ["admin-subs", status], queryFn: () => api.listSubmissions(status), enabled: area === "Submissions" });
  const comments = useQuery({ queryKey: ["admin-comments", commentFilter], queryFn: () => api.listComments(commentFilter), enabled: area === "Comments" });

  const review = useMutation({
    mutationFn: (action: "approve" | "reject" | "request-changes" | "schedule" | "publish") => api.reviewSubmission(open!.id, action),
    onMutate: () => setBusy(true),
    onSettled: () => {
      setBusy(false);
      setConfirm(null);
      setOpen(null);
      queryClient.invalidateQueries({ queryKey: ["admin-subs"] });
    },
  });

  const reviewComment = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "hide" | "delete" | "warn" }) => api.reviewComment(id, action),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-comments"] }),
  });

  return (
    <AdminShell title="Moderation" subtitle="Every decision notifies the member. Rejections need two-person review in production.">
      <div className="admin-tabs" role="tablist" aria-label="Moderation areas">
        {areaTabs.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={area === t} className={area === t ? "is-active" : ""} onClick={() => setArea(t)}>{t}</button>
        ))}
      </div>

      {area === "Submissions" ? (
        <SectionCard title="Review queue">
          <div className="admin-tabs" role="tablist" aria-label="Submission status">
            {queueTabs.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={status === t} className={status === t ? "is-active" : ""} onClick={() => setStatus(t)}>
                {t === "All" ? "All" : submissionStatusLabels[t as keyof typeof submissionStatusLabels]}
              </button>
            ))}
          </div>
          <QueryState loading={subs.isLoading} error={subs.error} empty={!subs.data || subs.data.length === 0} emptyText="Queue is clear for this state." onRetry={() => subs.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Submission</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Review</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(subs.data ?? []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell><span className="admin-row-main">{s.title}</span><span className="admin-row-sub">{s.id} · {formatAdminDate(s.submittedAt)}</span></TableCell>
                      <TableCell><span className="admin-row-main">{s.author}</span><span className="admin-row-sub">{s.memberId} · {s.country}</span></TableCell>
                      <TableCell><StatusBadge status={submissionStatusLabels[s.status]} /></TableCell>
                      <TableCell className="text-right"><button type="button" className="admin-link-btn" onClick={() => setOpen(s)}>Open</button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      ) : (
        <SectionCard title="Comment moderation" intro="Reported, flagged, and restricted-author comments.">
          <div className="admin-tabs" role="tablist" aria-label="Comment filter">
            {commentTabs.map((t) => (
              <button key={t} type="button" role="tab" aria-selected={commentFilter === t} className={commentFilter === t ? "is-active" : ""} onClick={() => setCommentFilter(t)}>{t}</button>
            ))}
          </div>
          <QueryState loading={comments.isLoading} error={comments.error} empty={!comments.data || comments.data.length === 0} emptyText="No comments in this state." onRetry={() => comments.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Comment</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(comments.data ?? []).map((c) => (
                    <TableRow key={c.id}>
                      <TableCell><span className="admin-row-main">{c.body}</span><span className="admin-row-sub">{c.id} · {c.flags} flags · {c.reason}</span></TableCell>
                      <TableCell><span className="admin-row-main">{c.author}</span><span className="admin-row-sub">{c.memberId}</span></TableCell>
                      <TableCell><StatusBadge status={c.status[0].toUpperCase() + c.status.slice(1)} /></TableCell>
                      <TableCell>
                        <div className="admin-row-actions">
                          <Button type="button" size="sm" variant="outline" onClick={() => reviewComment.mutate({ id: c.id, action: "approve" })}>Approve</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => reviewComment.mutate({ id: c.id, action: "hide" })}>Hide</Button>
                          <Button type="button" size="sm" variant="ghost" onClick={() => reviewComment.mutate({ id: c.id, action: "warn" })}>Warn</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      )}

      {open ? (
        <DetailDrawer title={open.title} subtitle={`${open.id} · ${open.author} · ${open.memberId}`} onClose={() => setOpen(null)}>
          <DetailRow label="Country"><span>{open.country}</span></DetailRow>
          <DetailRow label="Submitted"><span>{formatAdminDate(open.submittedAt)}</span></DetailRow>
          <DetailRow label="Trust"><StatusBadge status={open.trustStatus[0].toUpperCase() + open.trustStatus.slice(1)} /></DetailRow>
          <DetailRow label="Status"><StatusBadge status={submissionStatusLabels[open.status]} /></DetailRow>
          <p style={{ fontSize: 13, marginTop: 12 }}>{open.body}</p>
          {open.riskIndicators.length > 0 ? <p style={{ fontSize: 12, color: "var(--danger)" }}>Risk: {open.riskIndicators.join(" · ")}</p> : null}
          {open.reviewerNote ? <p style={{ fontSize: 12 }}>Reviewer note: {open.reviewerNote}</p> : null}
          <div className="admin-toolbar" style={{ marginTop: 16 }}>
            <Button type="button" onClick={() => setConfirm({ action: "approve", label: "Approve" })}>Approve</Button>
            <Button type="button" variant="outline" onClick={() => setConfirm({ action: "request-changes", label: "Request changes" })}>Request changes</Button>
            <Button type="button" variant="outline" onClick={() => setConfirm({ action: "schedule", label: "Schedule" })}>Schedule</Button>
            <Button type="button" variant="destructive" onClick={() => setConfirm({ action: "reject", label: "Reject", danger: true })}>Reject</Button>
          </div>
          <NoteForm onSubmit={() => setConfirm({ action: "request-changes", label: "Request changes" })} />
        </DetailDrawer>
      ) : null}
      {confirm && open ? (
        <ConfirmDialog title={`${confirm.label} submission`} body={`${open.title} by ${open.author}. The member will be notified of this result.`} confirmLabel={confirm.label} danger={confirm.danger} busy={busy} onConfirm={() => review.mutate(confirm.action)} onCancel={() => setConfirm(null)} />
      ) : null}
    </AdminShell>
  );
}
