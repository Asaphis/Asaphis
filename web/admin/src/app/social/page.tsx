"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";

// SOCIAL / COMMUNITY control center — operates on the same Post/Report system
// as the member Home feed. Admin official posts published here appear in
// member HOME via Feed Service (no separate fake database).
export default function SocialPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("Posts");
  const [status, setStatus] = useState("All");

  const posts = useQuery({ queryKey: ["social-posts", status], queryFn: () => api.listSocialPosts(status), enabled: tab === "Posts" });
  const reports = useQuery({ queryKey: ["social-reports", status], queryFn: () => api.listReports(status), enabled: tab === "Reports" });

  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" | "request-changes" | "publish" }) =>
      api.reviewSocialPost(id, decision),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["social-posts"] }),
  });

  const reviewReport = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "resolve" | "dismiss" }) => api.reviewReport(id, decision),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["social-reports"] }),
  });

  return (
    <AdminShell title="Social" subtitle="Official posts, member posts, reports — same feed members see on Home.">
      <div className="admin-tabs" role="tablist" aria-label="Social areas">
        {["Posts", "Reports"].map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        {["All", "UNDER_REVIEW", "PUBLISHED", "REJECTED"].map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)}>
            {s}
          </Button>
        ))}
      </div>

      {tab === "Posts" ? (
        <SectionCard title="Posts" intro="Approve to publish immediately to the member Home feed. Reject or request changes with member notification.">
          <QueryState loading={posts.isLoading} error={posts.error} empty={!posts.data || posts.data.length === 0} emptyText="No posts in this state." onRetry={() => posts.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Post</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Engagement</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(posts.data ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <span className="admin-row-main">{p.body.slice(0, 90) || "(media post)"}</span>
                        <span className="admin-row-sub">{p.authorName} · {p.mediaKind} · {p.visibility}</span>
                      </TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell><span className="admin-row-sub">❤️ {p.likeCount} · 💬 {p.commentCount} · ↗ {p.repostCount}</span></TableCell>
                      <TableCell>
                        <div className="admin-row-actions">
                          <Button size="sm" variant="outline" onClick={() => review.mutate({ id: p.id, decision: "approve" })}>Approve & Publish</Button>
                          <Button size="sm" variant="ghost" onClick={() => review.mutate({ id: p.id, decision: "request-changes" })}>Request changes</Button>
                          <Button size="sm" variant="ghost" onClick={() => review.mutate({ id: p.id, decision: "reject" })}>Reject</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      ) : null}

      {tab === "Reports" ? (
        <SectionCard title="Reports" intro="Member reports on posts, comments, profiles, messages, videos.">
          <QueryState loading={reports.isLoading} error={reports.error} empty={!reports.data || reports.data.length === 0} emptyText="No reports." onRetry={() => reports.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(reports.data ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>
                        <span className="admin-row-main">{r.reason}</span>
                        <span className="admin-row-sub">{r.targetKind} · {r.targetId}</span>
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>
                        <div className="admin-row-actions">
                          <Button size="sm" variant="outline" onClick={() => reviewReport.mutate({ id: r.id, decision: "resolve" })}>Resolve</Button>
                          <Button size="sm" variant="ghost" onClick={() => reviewReport.mutate({ id: r.id, decision: "dismiss" })}>Dismiss</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      ) : null}
    </AdminShell>
  );
}
