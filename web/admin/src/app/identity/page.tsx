"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { DetailDrawer, DetailRow, FilterSelect, NoteForm, QueryState, SectionCard, StatCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate } from "@/lib/admin-types";

const tabs = ["All", "pending", "processing", "verified", "rejected", "needs-review", "failed"];
const label = (v: string) => v.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");

export default function IdentityPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const query = useQuery({ queryKey: ["admin-identity", status], queryFn: () => api.listIdentityCases(status) });
  const detail = useQuery({ queryKey: ["admin-identity-case", openId], queryFn: () => api.getIdentityCase(openId!), enabled: Boolean(openId) });

  const review = useMutation({
    mutationFn: (action: "approve" | "reject" | "request-info" | "manual-review") => api.reviewIdentityCase(openId!, action),
    onMutate: () => setBusy(true),
    onSettled: () => {
      setBusy(false);
      queryClient.invalidateQueries({ queryKey: ["admin-identity"] });
      queryClient.invalidateQueries({ queryKey: ["admin-identity-case", openId] });
    },
  });

  const counts = (query.data ?? []).reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.status]: (acc[c.status] ?? 0) + 1 }), {});

  return (
    <AdminShell title="Identity & Verification" subtitle="Review document cases without exposing raw documents to unauthorized roles.">
      <div className="admin-grid-stats">
        {["pending", "processing", "verified", "rejected", "needs-review", "failed"].map((s) => (
          <StatCard key={s} label={label(s)} value={String(counts[s] ?? 0)} tone={s === "needs-review" || s === "pending" ? "warn" : s === "rejected" || s === "failed" ? "danger" : s === "verified" ? "ok" : undefined} />
        ))}
      </div>
      <SectionCard title="Identity queue">
        <div className="admin-toolbar">
          <FilterSelect label="Status" value={status} onChange={setStatus} options={tabs} />
        </div>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data || query.data.length === 0} emptyText="No identity cases in this state." onRetry={() => query.refetch()}>
          <div className="admin-table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case</TableHead>
                  <TableHead>Member</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data ?? []).map((c) => (
                  <TableRow key={c.id}>
                    <TableCell><span className="admin-row-main">{c.id}</span><span className="admin-row-sub">{formatAdminDate(c.submittedAt)}</span></TableCell>
                    <TableCell><span className="admin-row-main">{c.memberName}</span><span className="admin-row-sub">{c.memberId} · {c.country}</span></TableCell>
                    <TableCell><span className="admin-row-main">{c.documentType}</span><span className="admin-row-sub">{c.provider}</span></TableCell>
                    <TableCell><StatusBadge status={label(c.status)} /></TableCell>
                    <TableCell className="text-right"><button type="button" className="admin-link-btn" onClick={() => setOpenId(c.id)}>Review</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </QueryState>
      </SectionCard>
      {openId ? (
        <DetailDrawer title={`Case ${openId}`} subtitle={detail.data ? `${detail.data.memberName} · ${detail.data.memberId}` : undefined} onClose={() => setOpenId(null)}>
          {detail.data ? (
            <>
              <DetailRow label="Country"><span>{detail.data.country}</span></DetailRow>
              <DetailRow label="Document type"><span>{detail.data.documentType}</span></DetailRow>
              <DetailRow label="Provider"><span>{detail.data.provider}</span></DetailRow>
              <DetailRow label="Result"><span>{detail.data.result}</span></DetailRow>
              <DetailRow label="Submitted"><span>{formatAdminDate(detail.data.submittedAt)}</span></DetailRow>
              <DetailRow label="Status"><StatusBadge status={label(detail.data.status)} /></DetailRow>
              <h3 style={{ fontSize: 12, marginTop: 12 }}>Risk indicators</h3>
              {detail.data.riskIndicators.length === 0 ? <p className="admin-subtitle">No risk indicators.</p> : detail.data.riskIndicators.map((r) => <p key={r} style={{ fontSize: 12 }}>• {r}</p>)}
              <h3 style={{ fontSize: 12, marginTop: 12 }}>Review history</h3>
              <div className="admin-timeline">
                {detail.data.reviewHistory.map((h, i) => (
                  <div key={i} className="admin-timeline-item"><strong>{h.action} · {h.by}</strong><span>{formatAdminDate(h.at)}{h.note ? ` · ${h.note}` : ""}</span></div>
                ))}
              </div>
              <div className="admin-toolbar" style={{ marginTop: 16 }}>
                <Button type="button" onClick={() => review.mutate("approve")} disabled={busy}>Approve</Button>
                <Button type="button" variant="outline" onClick={() => review.mutate("request-info")} disabled={busy}>Request info</Button>
                <Button type="button" variant="outline" onClick={() => review.mutate("manual-review")} disabled={busy}>Manual review</Button>
                <Button type="button" variant="destructive" onClick={() => review.mutate("reject")} disabled={busy}>Reject</Button>
              </div>
              <NoteForm busy={busy} onSubmit={() => review.mutate("request-info")} placeholder="Note requested information…" />
            </>
          ) : <p className="admin-subtitle">Loading case…</p>}
        </DetailDrawer>
      ) : null}
    </AdminShell>
  );
}
