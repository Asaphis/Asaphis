"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { DetailDrawer, DetailRow, QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import type { RegionCountry } from "@/lib/admin-types";

export default function RegionsPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<RegionCountry | null>(null);

  const query = useQuery({ queryKey: ["admin-regions"], queryFn: () => api.listCountries() });

  const update = useMutation({
    mutationFn: (patch: Partial<RegionCountry>) => api.updateCountry(open!.country, patch),
    onSuccess: (next) => {
      setOpen(next);
      queryClient.invalidateQueries({ queryKey: ["admin-regions"] });
    },
  });

  return (
    <AdminShell title="Regions & Countries" subtitle="Configuration rules — not hard-coded logic. Changes apply through the backend.">
      <SectionCard title="Configured countries" intro="Enable or disable a country, and define its verification and access rules.">
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data || query.data.length === 0} emptyText="No countries configured." onRetry={() => query.refetch()}>
          <div className="admin-table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Configure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data ?? []).map((c) => (
                  <TableRow key={c.country}>
                    <TableCell><span className="admin-row-main">{c.country}</span><span className="admin-row-sub">{c.eligibility}</span></TableCell>
                    <TableCell><span className="admin-row-sub">{c.documents.join(" / ")}</span></TableCell>
                    <TableCell>{c.provider}</TableCell>
                    <TableCell><StatusBadge status={c.enabled ? "Enabled" : "Hidden"} /></TableCell>
                    <TableCell className="text-right"><button type="button" className="admin-link-btn" onClick={() => setOpen(c)}>Open</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </QueryState>
      </SectionCard>
      {open ? (
        <DetailDrawer title={open.country} subtitle="Country configuration rules" onClose={() => setOpen(null)}>
          <DetailRow label="Enabled"><Button type="button" size="sm" variant="outline" onClick={() => update.mutate({ enabled: !open.enabled })}>{open.enabled ? "Disable country" : "Enable country"}</Button></DetailRow>
          <DetailRow label="Documents"><span>{open.documents.join(" / ")}</span></DetailRow>
          <DetailRow label="Verification provider"><span>{open.provider}</span></DetailRow>
          <DetailRow label="Phone required"><span>{open.phoneRequired ? "Yes" : "No"}</span></DetailRow>
          <DetailRow label="Liveness required"><span>{open.livenessRequired ? "Yes" : "No"}</span></DetailRow>
          <DetailRow label="Manual review"><Button type="button" size="sm" variant="ghost" onClick={() => update.mutate({ manualReview: !open.manualReview })}>{open.manualReview ? "On — turn off" : "Off — turn on"}</Button></DetailRow>
          <DetailRow label="Eligibility"><span>{open.eligibility}</span></DetailRow>
          <DetailRow label="Travel rule"><span>{open.travelRule}</span></DetailRow>
          <DetailRow label="Access rule"><span>{open.accessRule}</span></DetailRow>
        </DetailDrawer>
      ) : null}
    </AdminShell>
  );
}
