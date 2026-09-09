"use client";

import { useQuery } from "@tanstack/react-query";
import { AdminShell } from "@/components/admin/AdminShell";
import { BarList, QueryState, SectionCard, StatCard } from "@/components/admin/widgets";
import { useAdminApi } from "@/lib/use-admin-api";

export default function AnalyticsPage() {
  const api = useAdminApi();
  const query = useQuery({ queryKey: ["admin-analytics"], queryFn: () => api.getAnalytics() });

  return (
    <AdminShell title="Analytics" subtitle="Growth and engagement — not surveillance. Security telemetry stays in Security.">
      <QueryState loading={query.isLoading} error={query.error} empty={!query.data} emptyText="Analytics unavailable." onRetry={() => query.refetch()}>
        {query.data ? (
          <>
            <div className="admin-grid-stats">
              <StatCard label="Verification rate" value={`${query.data.verificationRate}%`} />
              <StatCard label="Active members" value={query.data.activeMembers.toLocaleString()} />
              <StatCard label="Content engagement" value={query.data.contentEngagement.toLocaleString()} />
              <StatCard label="Video views" value={query.data.videoViews.toLocaleString()} />
              <StatCard label="Education engagement" value={query.data.educationEngagement.toLocaleString()} />
              <StatCard label="Community submissions" value={String(query.data.communitySubmissions)} />
            </div>
            <div className="admin-two-col">
              <SectionCard title="Member growth" intro="New members per month.">
                <BarList items={query.data.memberGrowth} />
              </SectionCard>
              <SectionCard title="Country distribution" intro="Where members are verified.">
                <BarList items={query.data.countryDistribution} />
              </SectionCard>
            </div>
            <div className="admin-two-col">
              <SectionCard title="Moderation outcomes" intro="Approved, rejected, and pending submissions.">
                <BarList items={[
                  { label: "Approved", value: query.data.moderation.approved },
                  { label: "Rejected", value: query.data.moderation.rejected },
                  { label: "Pending", value: query.data.moderation.pending },
                ]} />
              </SectionCard>
              <SectionCard title="Contributions by currency" intro="Recorded membership contributions.">
                <BarList items={query.data.contributions} format={(v) => v.toLocaleString()} />
              </SectionCard>
            </div>
          </>
        ) : null}
      </QueryState>
    </AdminShell>
  );
}
