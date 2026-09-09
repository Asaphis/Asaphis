"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { BarList, QueryState, SectionCard, StatCard } from "@/components/admin/widgets";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate } from "@/lib/admin-types";

export default function DashboardPage() {
  const api = useAdminApi();
  const stats = useQuery({ queryKey: ["admin-dashboard"], queryFn: () => api.getDashboardStats() });
  const analytics = useQuery({ queryKey: ["admin-analytics-mini"], queryFn: () => api.getAnalytics() });

  return (
    <AdminShell title="Dashboard" subtitle="Operational overview of the entire platform.">
      <QueryState loading={stats.isLoading} error={stats.error} empty={!stats.data} emptyText="No dashboard data available." onRetry={() => stats.refetch()}>
        {stats.data ? (
          <>
            <div className="admin-grid-stats">
              <StatCard label="Total members" value={stats.data.totalMembers.toLocaleString()} hint={`${stats.data.activeMembers.toLocaleString()} active`} />
              <StatCard label="Verified members" value={stats.data.verifiedMembers.toLocaleString()} hint="Identity + phone verified" tone="ok" />
              <StatCard label="Pending identity" value={String(stats.data.pendingIdentity)} hint="Needs reviewer attention" tone={stats.data.pendingIdentity > 0 ? "warn" : undefined} />
              <StatCard label="Pending submissions" value={String(stats.data.pendingSubmissions)} hint="Moderation queue" tone={stats.data.pendingSubmissions > 0 ? "warn" : undefined} />
              <StatCard label="Pending travel" value={String(stats.data.pendingTravel)} hint="Time-bound reviews" />
              <StatCard label="Contributions" value={stats.data.contributionsTotal} hint="Across all providers" />
              <StatCard label="Suspicious sessions" value={String(stats.data.suspiciousSessions)} hint="Review in Security" tone={stats.data.suspiciousSessions > 0 ? "danger" : undefined} />
              <StatCard label="Restricted accounts" value={String(stats.data.restrictedAccounts)} hint="Active restrictions" tone={stats.data.restrictedAccounts > 0 ? "warn" : undefined} />
            </div>
            <div className="admin-two-col">
              <SectionCard title="Recent security alerts" intro="Highest signal events first." action={<Link className="admin-link-btn" href="/security">Open Security</Link>}>
                <div className="admin-timeline">
                  {stats.data.recentAlerts.map((a) => (
                    <div key={a.id} className="admin-timeline-item">
                      <strong>{a.title}</strong>
                      <span>{formatAdminDate(a.at)} · Risk: {a.risk}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Recent activity" intro="Latest logged admin actions." action={<Link className="admin-link-btn" href="/security">Audit log</Link>}>
                <div className="admin-timeline">
                  {stats.data.recentActivity.map((a) => (
                    <div key={a.id} className="admin-timeline-item">
                      <strong>{a.action}</strong>
                      <span>{a.actor} · {formatAdminDate(a.at)}</span>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </div>
            {analytics.data ? (
              <SectionCard title="Member growth" intro="New members per month." action={<Link className="admin-link-btn" href="/analytics">Full analytics</Link>}>
                <BarList items={analytics.data.memberGrowth} />
              </SectionCard>
            ) : null}
          </>
        ) : null}
      </QueryState>
    </AdminShell>
  );
}
