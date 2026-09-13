"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function SettingsPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const { admin } = useAdminAuth();
  const [group, setGroup] = useState("General");
  const [orgName, setOrgName] = useState("");
  const [opsContact, setOpsContact] = useState("");
  const [saved, setSaved] = useState(false);
  const audit = useQuery({ queryKey: ["admin-settings-audit"], queryFn: () => api.listAuditEvents() });
  const flagsQuery = useQuery({ queryKey: ["admin-flags"], queryFn: () => api.listFeatureFlags(), enabled: group === "Feature flags" });
  const directoryQuery = useQuery({ queryKey: ["admin-directory"], queryFn: () => api.listAdmins(), enabled: group === "Admin users" });
  const appSettingsQuery = useQuery({ queryKey: ["admin-app-settings"], queryFn: () => api.getAppSettings(), enabled: group === "General" });
  const providersQuery = useQuery({ queryKey: ["admin-providers-settings"], queryFn: () => api.listProviders(), enabled: group === "Integrations" });

  const toggleFlag = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) => api.setFeatureFlag(key, enabled),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-flags"] }),
  });

  const saveGeneral = useMutation({
    mutationFn: async () => {
      if (orgName.trim()) await api.setAppSetting("ORG_NAME", orgName.trim());
      if (opsContact.trim()) await api.setAppSetting("OPS_CONTACT", opsContact.trim());
    },
    onSuccess: () => {
      setSaved(true);
      setOrgName("");
      setOpsContact("");
      queryClient.invalidateQueries({ queryKey: ["admin-app-settings"] });
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const storedOrg = String(appSettingsQuery.data?.ORG_NAME ?? "");
  const storedContact = String(appSettingsQuery.data?.OPS_CONTACT ?? "");

  return (
    <AdminShell title="Settings" subtitle="Platform configuration. Signed in as Super Admin controls with full audit.">
      <div className="admin-tabs" role="tablist" aria-label="Settings groups">
        {groups.map((g) => (
          <button key={g} type="button" role="tab" aria-selected={group === g} className={group === g ? "is-active" : ""} onClick={() => setGroup(g)}>{g}</button>
        ))}
      </div>

      {group === "General" ? (
        <SectionCard title="General" intro="Organization name and operations contact, stored in the backend." action={saved ? <span style={{ fontSize: 12, color: "var(--ok)" }}>Saved.</span> : undefined}>
          <QueryState loading={appSettingsQuery.isLoading} error={appSettingsQuery.error} empty={false} emptyText="" onRetry={() => appSettingsQuery.refetch()}>
            <div className="form-field"><Label htmlFor="s-org">Organization name</Label><Input id="s-org" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder={storedOrg || "AsaPhis ORG"} /></div>
            <div className="form-field"><Label htmlFor="s-contact">Operations contact</Label><Input id="s-contact" value={opsContact} onChange={(e) => setOpsContact(e.target.value)} placeholder={storedContact || "ops@asaphis.org"} /></div>
            <Button type="button" style={{ marginTop: 12 }} disabled={saveGeneral.isPending || (!orgName.trim() && !opsContact.trim())} onClick={() => saveGeneral.mutate()}>
              {saveGeneral.isPending ? "Saving…" : "Save general settings"}
            </Button>
          </QueryState>
        </SectionCard>
      ) : null}

      {group === "Feature flags" ? (
        <SectionCard title="Feature flags" intro="Roll out behavior without code changes.">
          <QueryState loading={flagsQuery.isLoading} error={flagsQuery.error} empty={!flagsQuery.data || flagsQuery.data.length === 0} emptyText="No feature flags stored yet." onRetry={() => flagsQuery.refetch()}>
            {(flagsQuery.data ?? []).map((f) => (
              <div key={f.key} className="admin-detail-row">
                <span><strong style={{ color: "var(--foreground)" }}>{f.key}</strong></span>
                <Button type="button" size="sm" variant="outline" disabled={toggleFlag.isPending} onClick={() => toggleFlag.mutate({ key: f.key, enabled: !f.enabled })}>
                  {f.enabled ? "On — turn off" : "Off — turn on"}
                </Button>
              </div>
            ))}
          </QueryState>
        </SectionCard>
      ) : null}

      {group === "Admin users" ? (
        <SectionCard title="Admin users" intro="Least privilege: everyone sees only their areas.">
          <QueryState loading={directoryQuery.isLoading} error={directoryQuery.error} empty={!directoryQuery.data || directoryQuery.data.length === 0} emptyText="No admin accounts found." onRetry={() => directoryQuery.refetch()}>
            {(directoryQuery.data ?? []).map((u) => (
              <div key={u.email} className="admin-detail-row">
                <span><strong style={{ color: "var(--foreground)" }}>{u.name}</strong><span className="admin-row-sub">{u.email}{u.lastActive ? ` · active ${formatAdminDate(u.lastActive)}` : ""}</span></span>
                <StatusBadge status={u.role} />
              </div>
            ))}
          </QueryState>
          <p className="admin-subtitle" style={{ marginTop: 10 }}>Signed in as {admin?.name} · {admin?.role}. Invites go through verified work email in production.</p>
        </SectionCard>
      ) : null}

      {group === "Integrations" ? (
        <SectionCard title="Integrations" intro="Provider connections without exposing secrets.">
          <div className="admin-secret-note"><KeyRound size={14} aria-hidden="true" /><span>Verification and payment secrets are stored in secret management. This screen only references them and tests connectivity.</span></div>
          <QueryState loading={providersQuery.isLoading} error={providersQuery.error} empty={!providersQuery.data || providersQuery.data.length === 0} emptyText="No providers configured." onRetry={() => providersQuery.refetch()}>
            {(providersQuery.data ?? []).map((p) => (
              <div className="admin-detail-row" key={p.id} style={{ marginTop: 10 }}>
                <span>{p.name}{p.enabled ? "" : " (disabled)"}</span>
                <StatusBadge status={p.secretConfigured ? "Ready" : "No secret"} />
              </div>
            ))}
          </QueryState>
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
