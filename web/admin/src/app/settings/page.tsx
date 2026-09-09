"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminShell } from "@/components/admin/AdminShell";
import { QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminAuth } from "@/lib/admin-auth";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate } from "@/lib/admin-types";

const groups = ["General", "Branding", "Countries", "Verification", "Payments", "Notifications", "Security", "Community", "Moderation", "Privacy", "Feature flags", "Admin users", "Integrations"];

const flagDefaults = [
  { key: "memberChat", label: "Member-to-member chat", on: false, note: "Disabled for version 1." },
  { key: "trustedLowRiskPublishing", label: "Trusted fast-track publishing", on: false, note: "Lower friction for trusted members on low-risk content." },
  { key: "travelAutoExpiry", label: "Automatic travel expiry", on: true, note: "Permissions end at the displayed time." },
  { key: "vpnStrictMode", label: "Strict VPN review", on: true, note: "Flag VPN sessions for security review." },
];

const directory = [
  { name: "Adaeze Okonkwo", email: "adaeze@asaphis.org", role: "Super Admin", lastActive: "2026-09-08" },
  { name: "Sara Bakare", email: "sara@asaphis.org", role: "Security Admin", lastActive: "2026-09-08" },
  { name: "Chidi Eze", email: "chidi@asaphis.org", role: "Content Admin", lastActive: "2026-09-07" },
  { name: "Lena Mensimah", email: "lena@asaphis.org", role: "Moderator", lastActive: "2026-09-07" },
  { name: "Rami Haddad", email: "rami@asaphis.org", role: "Finance Admin", lastActive: "2026-09-06" },
];

export default function SettingsPage() {
  const api = useAdminApi();
  const { admin } = useAdminAuth();
  const [group, setGroup] = useState("General");
  const [flags, setFlags] = useState(flagDefaults);
  const [saved, setSaved] = useState(false);
  const audit = useQuery({ queryKey: ["admin-settings-audit"], queryFn: () => api.listAuditEvents() });

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <AdminShell title="Settings" subtitle="Platform configuration. Signed in as Super Admin controls with full audit.">
      <div className="admin-tabs" role="tablist" aria-label="Settings groups">
        {groups.map((g) => (
          <button key={g} type="button" role="tab" aria-selected={group === g} className={group === g ? "is-active" : ""} onClick={() => setGroup(g)}>{g}</button>
        ))}
      </div>

      {group === "General" ? (
        <SectionCard title="General" intro="Organization name, contact, and timezone." action={saved ? <span style={{ fontSize: 12, color: "var(--ok)" }}>Saved.</span> : undefined}>
          <div className="form-field"><Label htmlFor="s-org">Organization name</Label><Input id="s-org" defaultValue="AsaPhis ORG" /></div>
          <div className="form-field"><Label htmlFor="s-contact">Operations contact</Label><Input id="s-contact" defaultValue="ops@asaphis.org" /></div>
          <Button type="button" style={{ marginTop: 12 }} onClick={save}>Save general settings</Button>
        </SectionCard>
      ) : null}

      {group === "Feature flags" ? (
        <SectionCard title="Feature flags" intro="Roll out behavior without code changes.">
          {flags.map((f) => (
            <div key={f.key} className="admin-detail-row">
              <span><strong style={{ color: "var(--foreground)" }}>{f.label}</strong><span className="admin-row-sub">{f.note}</span></span>
              <Button type="button" size="sm" variant="outline" onClick={() => setFlags(flags.map((x) => x.key === f.key ? { ...x, on: !x.on } : x))}>{f.on ? "On — turn off" : "Off — turn on"}</Button>
            </div>
          ))}
        </SectionCard>
      ) : null}

      {group === "Admin users" ? (
        <SectionCard title="Admin users" intro="Least privilege: everyone sees only their areas.">
          {directory.map((u) => (
            <div key={u.email} className="admin-detail-row">
              <span><strong style={{ color: "var(--foreground)" }}>{u.name}</strong><span className="admin-row-sub">{u.email} · active {formatAdminDate(u.lastActive)}</span></span>
              <StatusBadge status={u.role} />
            </div>
          ))}
          <p className="admin-subtitle" style={{ marginTop: 10 }}>Signed in as {admin?.name} · {admin?.role}. Invites go through verified work email in production.</p>
        </SectionCard>
      ) : null}

      {group === "Integrations" ? (
        <SectionCard title="Integrations" intro="Provider connections without exposing secrets.">
          <div className="admin-secret-note"><KeyRound size={14} aria-hidden="true" /><span>Verification and payment secrets are stored in secret management. This screen only references them and tests connectivity.</span></div>
          <div className="admin-detail-row" style={{ marginTop: 10 }}><span>Verification · Provider A</span><StatusBadge status="Ready" /></div>
          <div className="admin-detail-row"><span>Verification · Provider B</span><StatusBadge status="Ready" /></div>
          <div className="admin-detail-row"><span>Payments · Paystack / Flutterwave / Stripe</span><StatusBadge status="Ready" /></div>
        </SectionCard>
      ) : null}

      {!["General", "Feature flags", "Admin users", "Integrations"].includes(group) ? (
        <SectionCard title={group} intro="This group is managed in its dedicated area — changes here would duplicate that source of truth.">
          <p style={{ fontSize: 13 }}>
            {group === "Countries" && "See Regions & Countries for enablement, documents, providers, and rules."}
            {group === "Verification" && "See Identity & Verification for queues, providers, and review policy."}
            {group === "Payments" && "See Payments for amounts, providers, priorities, and connectivity tests."}
            {group === "Notifications" && "See Notifications for audiences, channels, and history."}
            {group === "Security" && "See Security for sessions, risk, restrictions, and audit."}
            {group === "Community" && "See Community for links, descriptions, and posting rules."}
            {group === "Moderation" && "See Moderation for queues, comment review, and decision policy."}
            {group === "Branding" && "Brand mark, wordmark, and tagline — Knowledge · community · future."}
            {group === "Privacy" && "Retention windows, data access roles, and export policy live with the backend policy service."}
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title="Recent audited changes" intro="Settings changes appear here with actor and role.">
        <QueryState loading={audit.isLoading} error={audit.error} empty={!audit.data || audit.data.length === 0} emptyText="No audited changes." onRetry={() => audit.refetch()}>
          <div className="admin-timeline">
            {(audit.data ?? []).slice(0, 5).map((a) => (
              <div key={a.id} className="admin-timeline-item"><strong>{a.action}</strong><span>{a.actor} · {a.role} → {a.target} · {formatAdminDate(a.at)}</span></div>
            ))}
          </div>
        </QueryState>
      </SectionCard>
    </AdminShell>
  );
}
