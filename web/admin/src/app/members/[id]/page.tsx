"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDialog, DetailDrawer, DetailRow, QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate, restrictionLabels, type RestrictionType } from "@/lib/admin-types";

const label = (v: string) => v.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const { can } = useAdminAuth();
  const [restrictOpen, setRestrictOpen] = useState(false);
  const [travelOpen, setTravelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const member = useQuery({ queryKey: ["admin-member", id], queryFn: () => api.getMember(id) });
  const sessions = useQuery({ queryKey: ["admin-member-sessions", id], queryFn: () => api.listSessions() });
  const devices = useQuery({ queryKey: ["admin-member-devices", id], queryFn: () => api.listDevices() });
  const cases = useQuery({ queryKey: ["admin-member-cases", id], queryFn: () => api.listIdentityCases() });
  const restrictions = useQuery({ queryKey: ["admin-restrictions"], queryFn: () => api.listRestrictions() });
  const travel = useQuery({ queryKey: ["admin-travel"], queryFn: () => api.listTravelRequests() });
  const tickets = useQuery({ queryKey: ["admin-tickets"], queryFn: () => api.listTickets() });

  const restrict = useMutation({
    mutationFn: () => api.applyRestriction({ memberId: id, type: "limited", reason: "Manual review by admin", duration: "7 days", affectedFeatures: ["Community submissions"] }),
    onMutate: () => setBusy(true),
    onSettled: () => {
      setBusy(false);
      setRestrictOpen(false);
      queryClient.invalidateQueries({ queryKey: ["admin-restrictions"] });
    },
  });

  const terminate = useMutation({
    mutationFn: (sessionId: string) => api.terminateSession(sessionId),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-member-sessions", id] }),
  });

  return (
    <AdminShell title={member.data ? member.data.name : "Member profile"} subtitle={id}>
      <QueryState loading={member.isLoading} error={member.error} empty={!member.data} emptyText="Member not found." onRetry={() => member.refetch()}>
        {member.data ? (
          <>
            <div className="admin-two-col">
              <SectionCard title="Identity & account">
                <DetailRow label="Member ID"><span>{member.data.id}</span></DetailRow>
                <DetailRow label="Identity status"><StatusBadge status={label(member.data.identityStatus)} /></DetailRow>
                <DetailRow label="Phone"><span>{member.data.phoneVerified ? "Verified" : "Not verified"} · {member.data.phone}</span></DetailRow>
                <DetailRow label="Account status"><StatusBadge status={label(member.data.accountStatus)} /></DetailRow>
                <DetailRow label="Trust status"><StatusBadge status={label(member.data.trustStatus)} /></DetailRow>
                <DetailRow label="Country"><span>{member.data.country}</span></DetailRow>
                <DetailRow label="Current access"><span>{member.data.currentCountry} · Travel {member.data.travelStatus}</span></DetailRow>
                <DetailRow label="Member since"><span>{formatAdminDate(member.data.memberSince)}</span></DetailRow>
                {can("security") ? (
                  <div className="admin-toolbar" style={{ marginTop: 14 }}>
                    <Button type="button" variant="outline" onClick={() => setRestrictOpen(true)}>Apply restriction</Button>
                  </div>
                ) : null}
              </SectionCard>
              <SectionCard title="Verification history" intro="Identity cases for this member.">
                {(cases.data ?? []).filter((c) => c.memberId === id).map((c) => (
                  <div key={c.id} className="admin-timeline-item" style={{ marginBottom: 10 }}>
                    <strong>{c.id} · {c.documentType} via {c.provider}</strong>
                    <span>{label(c.status)} · {c.result} · {formatAdminDate(c.submittedAt)}</span>
                  </div>
                )) ?? null}
                {(cases.data ?? []).filter((c) => c.memberId === id).length === 0 ? <p className="admin-subtitle">No identity cases on file.</p> : null}
              </SectionCard>
            </div>
            <div className="admin-two-col">
              <SectionCard title="Trusted devices & sessions">
                <h3 style={{ fontSize: 12 }}>Devices</h3>
                {(devices.data ?? []).filter((d) => d.memberId === id).map((d) => (
                  <DetailRow key={d.id} label={d.label}><StatusBadge status={d.trusted ? "Trusted" : "New"} /></DetailRow>
                ))}
                <h3 style={{ fontSize: 12, marginTop: 12 }}>Active sessions</h3>
                {(sessions.data ?? []).filter((s) => s.memberId === id && s.status !== "terminated").map((s) => (
                  <DetailRow key={s.id} label={`${s.device} · ${s.country}${s.vpnDetected ? " · VPN" : ""}`}>
                    <span><StatusBadge status={label(s.status)} /> <Button type="button" variant="link" onClick={() => terminate.mutate(s.id)}>Terminate</Button></span>
                  </DetailRow>
                ))}
              </SectionCard>
              <SectionCard title="Operational history">
                <h3 style={{ fontSize: 12 }}>Travel authorizations</h3>
                {(travel.data ?? []).filter((t) => t.memberId === id).map((t) => (
                  <DetailRow key={t.id} label={`${t.destination} · ${t.startDate} → ${t.endDate}`}><StatusBadge status={label(t.status)} /></DetailRow>
                ))}
                <h3 style={{ fontSize: 12, marginTop: 12 }}>Support requests</h3>
                {(tickets.data ?? []).filter((t) => t.memberId === id).map((t) => (
                  <DetailRow key={t.id} label={t.subject}><StatusBadge status={label(t.status)} /></DetailRow>
                ))}
                <h3 style={{ fontSize: 12, marginTop: 12 }}>Active restrictions</h3>
                {(restrictions.data ?? []).filter((r) => r.memberId === id && r.active).map((r) => (
                  <DetailRow key={r.id} label={restrictionLabels[r.type as RestrictionType] ?? r.type}><span>{r.duration}</span></DetailRow>
                ))}
              </SectionCard>
            </div>
            <SectionCard title="Danger zone" intro="Restricted to Security Admins and Super Admins.">
              <div className="admin-toolbar">
                <Button type="button" variant="outline" onClick={() => setTravelOpen(true)}>Travel authorizations</Button>
                <Link className="admin-link-btn" href="/members">Back to directory</Link>
              </div>
            </SectionCard>
          </>
        ) : null}
      </QueryState>
      {restrictOpen ? (
        <ConfirmDialog title="Apply limited restriction" body="This limits community submissions for 7 days and notifies the member. Continue?" confirmLabel="Apply restriction" onConfirm={() => restrict.mutate()} onCancel={() => setRestrictOpen(false)} busy={busy} />
      ) : null}
      {travelOpen ? (
        <DetailDrawer title="Travel authorizations" subtitle={id} onClose={() => setTravelOpen(false)}>
          {(travel.data ?? []).filter((t) => t.memberId === id).map((t) => (
            <div key={t.id} className="admin-timeline-item" style={{ marginBottom: 10 }}>
              <strong>{t.destination} · {t.startDate} → {t.endDate}</strong>
              <span>Status {label(t.status)} · Risk {t.risk} · {t.vpnDetected ? "VPN detected" : "No VPN"}</span>
            </div>
          ))}
        </DetailDrawer>
      ) : null}
    </AdminShell>
  );
}
