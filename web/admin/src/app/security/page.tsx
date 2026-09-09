"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { ConfirmDialog, DetailDrawer, DetailRow, QueryState, SectionCard, StatCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate, restrictionLabels, type RestrictionType, type SecurityEvent } from "@/lib/admin-types";

const tabs = ["Overview", "Risk events", "Sessions", "Devices", "Travel", "Restrictions", "Requests", "Audit log"];
const label = (v: string) => v.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");

export default function SecurityPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("Overview");
  const [event, setEvent] = useState<SecurityEvent | null>(null);
  const [confirmSession, setConfirmSession] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rMember, setRMember] = useState("");
  const [rType, setRType] = useState<RestrictionType>("limited");
  const [rReason, setRReason] = useState("");

  const events = useQuery({ queryKey: ["admin-events"], queryFn: () => api.listSecurityEvents() });
  const sessions = useQuery({ queryKey: ["admin-sessions"], queryFn: () => api.listSessions() });
  const devices = useQuery({ queryKey: ["admin-devices"], queryFn: () => api.listDevices() });
  const travel = useQuery({ queryKey: ["admin-travel-sec"], queryFn: () => api.listTravelRequests() });
  const restrictions = useQuery({ queryKey: ["admin-restrictions-sec"], queryFn: () => api.listRestrictions() });
  const requests = useQuery({ queryKey: ["admin-sec-requests"], queryFn: () => api.listSecurityRequests() });
  const audit = useQuery({ queryKey: ["admin-audit"], queryFn: () => api.listAuditEvents() });

  const resolveEvent = useMutation({
    mutationFn: (id: string) => api.updateSecurityEvent(id, "resolved"),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-events"] }),
  });

  const terminate = useMutation({
    mutationFn: (id: string) => api.terminateSession(id),
    onMutate: () => setBusy(true),
    onSettled: () => {
      setBusy(false);
      setConfirmSession(null);
      queryClient.invalidateQueries({ queryKey: ["admin-sessions"] });
    },
  });

  const reviewTravel = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" | "revoke" | "request-verification" }) => api.reviewTravelRequest(id, action),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-travel-sec"] }),
  });

  const applyRestriction = useMutation({
    mutationFn: () => api.applyRestriction({ memberId: rMember, type: rType, reason: rReason || "Manual review", duration: "7 days", affectedFeatures: ["Community submissions"] }),
    onSettled: () => {
      setRMember("");
      setRReason("");
      queryClient.invalidateQueries({ queryKey: ["admin-restrictions-sec"] });
    },
  });

  const lift = useMutation({
    mutationFn: (id: string) => api.liftRestriction(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-restrictions-sec"] }),
  });

  const suspicious = (sessions.data ?? []).filter((s) => s.status === "suspicious").length;
  const openEvents = (events.data ?? []).filter((e) => e.status === "open").length;

  return (
    <AdminShell title="Security" subtitle="Sessions, risk, devices, travel, restrictions, and audit — with reasons behind every decision.">
      <div className="admin-tabs" role="tablist" aria-label="Security areas">
        {tabs.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Overview" ? (
        <>
          <div className="admin-grid-stats">
            <StatCard label="Active sessions" value={String((sessions.data ?? []).filter((s) => s.status === "active").length)} />
            <StatCard label="Suspicious sessions" value={String(suspicious)} tone={suspicious > 0 ? "danger" : undefined} />
            <StatCard label="Open risk events" value={String(openEvents)} tone={openEvents > 0 ? "warn" : undefined} />
            <StatCard label="Active restrictions" value={String((restrictions.data ?? []).filter((r) => r.active).length)} />
            <StatCard label="Pending travel" value={String((travel.data ?? []).filter((t) => t.status === "pending").length)} />
            <StatCard label="Open sec. requests" value={String((requests.data ?? []).filter((r) => r.status === "open").length)} />
          </div>
          <SectionCard title="Highest-signal events" intro="Open with the underlying signals attached.">
            <QueryState loading={events.isLoading} error={events.error} empty={!events.data || events.data.length === 0} emptyText="No security events." onRetry={() => events.refetch()}>
              {(events.data ?? []).slice(0, 4).map((e) => (
                <div key={e.id} className="admin-timeline-item" style={{ marginBottom: 10 }}>
                  <strong>{e.type} · {e.memberName} ({e.memberId})</strong>
                  <span>Risk {e.risk} · {e.previousLocation} → {e.currentLocation} · Travel {e.travelApproved ? "approved" : "not approved"} · {formatAdminDate(e.detectedAt)}</span>
                </div>
              ))}
            </QueryState>
          </SectionCard>
        </>
      ) : null}

      {tab === "Risk events" ? (
        <SectionCard title="Risk events" intro="Each event shows why the system flagged it.">
          <QueryState loading={events.isLoading} error={events.error} empty={!events.data || events.data.length === 0} emptyText="No risk events." onRetry={() => events.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Open</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(events.data ?? []).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell><span className="admin-row-main">{e.type}</span><span className="admin-row-sub">{e.memberName} · {e.id}</span></TableCell>
                      <TableCell><StatusBadge status={e.risk[0].toUpperCase() + e.risk.slice(1)} /></TableCell>
                      <TableCell><StatusBadge status={label(e.status)} /></TableCell>
                      <TableCell className="text-right"><button type="button" className="admin-link-btn" onClick={() => setEvent(e)}>Signals</button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      ) : null}

      {tab === "Sessions" ? (
        <SectionCard title="Active & suspicious sessions" intro="Terminate with confirmation. Risk, device, and location are always shown.">
          <QueryState loading={sessions.isLoading} error={sessions.error} empty={!sessions.data || sessions.data.length === 0} emptyText="No sessions." onRetry={() => sessions.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Session</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sessions.data ?? []).map((s) => (
                    <TableRow key={s.id}>
                      <TableCell><span className="admin-row-main">{s.memberName} · {s.device}</span><span className="admin-row-sub">{s.id} · {s.browser} · {s.os} · {s.ip}</span></TableCell>
                      <TableCell><span className="admin-row-sub">{s.country}{s.vpnDetected ? " · VPN" : ""}</span></TableCell>
                      <TableCell><StatusBadge status={s.risk[0].toUpperCase() + s.risk.slice(1)} /></TableCell>
                      <TableCell className="text-right">
                        {s.status === "terminated" ? <StatusBadge status="Expired" /> : <Button type="button" size="sm" variant="outline" onClick={() => setConfirmSession(s.id)}>Terminate</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      ) : null}

      {tab === "Devices" ? (
        <SectionCard title="Devices" intro="Trusted vs newly seen devices per member.">
          <QueryState loading={devices.isLoading} error={devices.error} empty={!devices.data || devices.data.length === 0} emptyText="No devices." onRetry={() => devices.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Trust</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(devices.data ?? []).map((d) => (
                    <TableRow key={d.id}>
                      <TableCell><span className="admin-row-main">{d.label}</span><span className="admin-row-sub">Seen {d.firstSeen} → {d.lastSeen}</span></TableCell>
                      <TableCell>{d.memberName} · {d.memberId}</TableCell>
                      <TableCell><StatusBadge status={d.trusted ? "Trusted" : "New"} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      ) : null}

      {tab === "Travel" ? (
        <SectionCard title="Travel requests" intro="Automatic expiration stays visible. Approve, reject, revoke, or ask for verification.">
          <QueryState loading={travel.isLoading} error={travel.error} empty={!travel.data || travel.data.length === 0} emptyText="No travel requests." onRetry={() => travel.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(travel.data ?? []).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell><span className="admin-row-main">{t.memberName} · {t.id}</span><span className="admin-row-sub">{t.device} · {t.reason}</span></TableCell>
                      <TableCell><span className="admin-row-sub">{t.verifiedCountry} → {t.destination} · IP {t.currentIpCountry}{t.vpnDetected ? " · VPN" : ""} · {t.startDate} → {t.endDate}{t.expiresAt ? ` · expires ${t.expiresAt}` : ""}</span></TableCell>
                      <TableCell><StatusBadge status={t.risk[0].toUpperCase() + t.risk.slice(1)} /></TableCell>
                      <TableCell>
                        <div className="admin-row-actions">
                          {t.status === "pending" ? (
                            <>
                              <Button type="button" size="sm" variant="outline" onClick={() => reviewTravel.mutate({ id: t.id, action: "approve" })}>Approve</Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => reviewTravel.mutate({ id: t.id, action: "reject" })}>Reject</Button>
                            </>
                          ) : <StatusBadge status={label(t.status)} />}
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

      {tab === "Restrictions" ? (
        <>
          <SectionCard title="Apply restriction" intro="Reason, duration, and affected features are required. Temporary ones expire automatically.">
            <div className="admin-toolbar">
              <div className="form-field" style={{ minWidth: 160 }}>
                <Label htmlFor="r-member">Member ID</Label>
                <Input id="r-member" value={rMember} onChange={(e) => setRMember(e.target.value)} placeholder="ASPH-10482" />
              </div>
              <div className="form-field" style={{ minWidth: 200 }}>
                <Label htmlFor="r-type">Restriction</Label>
                <select id="r-type" value={rType} onChange={(e) => setRType(e.target.value as RestrictionType)} style={{ height: 38, border: "1px solid var(--border)", borderRadius: 8, background: "#fff" }}>
                  {(Object.keys(restrictionLabels) as RestrictionType[]).map((r) => <option key={r} value={r}>{restrictionLabels[r]}</option>)}
                </select>
              </div>
              <div className="form-field" style={{ flex: 1, minWidth: 200 }}>
                <Label htmlFor="r-reason">Reason</Label>
                <Input id="r-reason" value={rReason} onChange={(e) => setRReason(e.target.value)} placeholder="Why is this needed?" />
              </div>
            </div>
            <Button type="button" disabled={!rMember.trim() || applyRestriction.isPending} onClick={() => applyRestriction.mutate()}>Apply restriction</Button>
          </SectionCard>
          <SectionCard title="Restriction register">
            <QueryState loading={restrictions.isLoading} error={restrictions.error} empty={!restrictions.data || restrictions.data.length === 0} emptyText="No restrictions on file." onRetry={() => restrictions.refetch()}>
              <div className="admin-table-wrap">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Restriction</TableHead>
                      <TableHead>Member</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(restrictions.data ?? []).map((r) => (
                      <TableRow key={r.id}>
                        <TableCell><span className="admin-row-main">{restrictionLabels[r.type]}</span><span className="admin-row-sub">{r.reason} · {r.duration} · {r.appliedBy}</span></TableCell>
                        <TableCell>{r.memberName} · {r.memberId}</TableCell>
                        <TableCell><StatusBadge status={r.active ? "Limited" : "Resolved"} /></TableCell>
                        <TableCell className="text-right">{r.active ? <Button type="button" size="sm" variant="outline" onClick={() => lift.mutate(r.id)}>Lift</Button> : null}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </QueryState>
          </SectionCard>
        </>
      ) : null}

      {tab === "Requests" ? (
        <SectionCard title="Security support requests" intro="Appeals, travel help, verification problems, takeover reports.">
          <QueryState loading={requests.isLoading} error={requests.error} empty={!requests.data || requests.data.length === 0} emptyText="No security requests." onRetry={() => requests.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(requests.data ?? []).map((r) => (
                    <TableRow key={r.id}>
                      <TableCell><span className="admin-row-main">{r.subject}</span><span className="admin-row-sub">{r.id} · {r.category} · {formatAdminDate(r.updatedAt)}</span></TableCell>
                      <TableCell>{r.memberName} · {r.memberId}</TableCell>
                      <TableCell><StatusBadge status={label(r.status)} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      ) : null}

      {tab === "Audit log" ? (
        <SectionCard title="Audit log" intro="Every admin action, who did it, and when.">
          <QueryState loading={audit.isLoading} error={audit.error} empty={!audit.data || audit.data.length === 0} emptyText="No audit events." onRetry={() => audit.refetch()}>
            <div className="admin-timeline">
              {(audit.data ?? []).map((a) => (
                <div key={a.id} className="admin-timeline-item">
                  <strong>{a.action}</strong>
                  <span>{a.actor} · {a.role} → {a.target} · {formatAdminDate(a.at)}</span>
                </div>
              ))}
            </div>
          </QueryState>
        </SectionCard>
      ) : null}

      {event ? (
        <DetailDrawer title={`Risk event ${event.id}`} subtitle={`${event.memberName} · ${event.memberId}`} onClose={() => setEvent(null)}>
          <DetailRow label="Signal"><span>{event.type}</span></DetailRow>
          <DetailRow label="Risk"><StatusBadge status={event.risk[0].toUpperCase() + event.risk.slice(1)} /></DetailRow>
          <DetailRow label="Previous location"><span>{event.previousLocation}</span></DetailRow>
          <DetailRow label="Current location"><span>{event.currentLocation}</span></DetailRow>
          <DetailRow label="Travel approval"><span>{event.travelApproved ? "Approved" : "Not approved"}</span></DetailRow>
          <h3 style={{ fontSize: 12, marginTop: 12 }}>Why this was flagged</h3>
          {event.signals.map((s) => <p key={s} style={{ fontSize: 12 }}>• {s}</p>)}
          <div className="admin-toolbar" style={{ marginTop: 14 }}>
            <Button type="button" onClick={() => { resolveEvent.mutate(event.id); setEvent(null); }}>Mark resolved</Button>
            <Button type="button" variant="outline" onClick={() => setEvent(null)}>Require verification</Button>
          </div>
        </DetailDrawer>
      ) : null}
      {confirmSession ? (
        <ConfirmDialog title="Terminate session" body="The member will be signed out of this device immediately. Continue?" confirmLabel="Terminate session" danger busy={busy} onConfirm={() => terminate.mutate(confirmSession)} onCancel={() => setConfirmSession(null)} />
      ) : null}
    </AdminShell>
  );
}
