"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { DetailDrawer, DetailRow, QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";

export default function PaymentsPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [openCountry, setOpenCountry] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  const countries = useQuery({ queryKey: ["admin-pay-countries"], queryFn: () => api.listCountryPayments() });
  const providers = useQuery({ queryKey: ["admin-pay-providers"], queryFn: () => api.listProviders() });

  const saveAmount = useMutation({
    mutationFn: () => api.updateCountryPayment(openCountry!, { amount: Number(amount) }),
    onSettled: () => {
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["admin-pay-countries"] });
    },
  });

  const toggle = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => api.toggleProvider(id, enabled),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-pay-providers"] }),
  });

  const test = useMutation({
    mutationFn: (id: string) => api.testProvider(id),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-pay-providers"] }),
  });

  const active = (countries.data ?? []).find((c) => c.country === openCountry);

  return (
    <AdminShell title="Payments" subtitle="Per-country configuration plus a global fallback. Secrets are never shown as editable text.">
      <SectionCard title="Country configuration" intro="Currency, contribution amount, methods, and provider priority per country.">
        <QueryState loading={countries.isLoading} error={countries.error} empty={!countries.data || countries.data.length === 0} emptyText="No payment configuration." onRetry={() => countries.refetch()}>
          <div className="admin-table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Country</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Providers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Configure</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(countries.data ?? []).map((c) => (
                  <TableRow key={c.country}>
                    <TableCell><span className="admin-row-main">{c.country}</span><span className="admin-row-sub">{c.methods.join(" · ")}</span></TableCell>
                    <TableCell><strong>{c.currency} {c.amount.toLocaleString()}</strong></TableCell>
                    <TableCell><span className="admin-row-sub">{c.providers.join(", ")}</span></TableCell>
                    <TableCell><StatusBadge status={c.enabled ? "Enabled" : "Hidden"} /></TableCell>
                    <TableCell className="text-right"><button type="button" className="admin-link-btn" onClick={() => setOpenCountry(c.country)}>Open</button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </QueryState>
      </SectionCard>

      <SectionCard title="Payment providers" intro="Connectivity can be tested without exposing secrets.">
        <QueryState loading={providers.isLoading} error={providers.error} empty={!providers.data || providers.data.length === 0} emptyText="No providers configured." onRetry={() => providers.refetch()}>
          <div className="admin-table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provider</TableHead>
                  <TableHead>Secret</TableHead>
                  <TableHead>Last test</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(providers.data ?? []).map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="admin-row-main">{p.name} <span className="admin-row-sub">· priority {p.priority}</span></span>
                      <span className="admin-row-sub">{p.countries.join(", ")} · {p.methods.join(", ")}</span>
                    </TableCell>
                    <TableCell>
                      {p.secretConfigured ? <span className="secret-masked">••••••••••</span> : <StatusBadge status="Failed" />}
                    </TableCell>
                    <TableCell>
                      {p.lastTestedAt ? <span className="admin-row-sub">{p.lastTestedAt} · <StatusBadge status={p.lastTestResult === "ok" ? "Ready" : "Failed"} /></span> : <span className="admin-row-sub">Never tested</span>}
                    </TableCell>
                    <TableCell>
                      <div className="admin-row-actions">
                        <Button type="button" size="sm" variant="outline" onClick={() => test.mutate(p.id)}><PlugZap size={13} /> Test</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => toggle.mutate({ id: p.id, enabled: !p.enabled })}>{p.enabled ? "Disable" : "Enable"}</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </QueryState>
        <p className="admin-secret-note" style={{ marginTop: 12 }}><KeyRound size={14} aria-hidden="true" /><span>API keys live in secure secret management and are only referenced here — never pasted into this UI.</span></p>
      </SectionCard>

      {active ? (
        <DetailDrawer title={active.country} subtitle={`${active.currency} ${active.amount.toLocaleString()}`} onClose={() => setOpenCountry(null)}>
          <DetailRow label="Currency"><span>{active.currency}</span></DetailRow>
          <DetailRow label="Methods"><span>{active.methods.join(", ")}</span></DetailRow>
          <DetailRow label="Providers"><span>{active.providers.join(", ")}</span></DetailRow>
          <div className="form-field" style={{ marginTop: 14 }}>
            <Label htmlFor="pay-amount">Contribution amount ({active.currency})</Label>
            <Input id="pay-amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={String(active.amount)} />
          </div>
          <Button type="button" style={{ marginTop: 10 }} onClick={() => saveAmount.mutate()} disabled={!amount || saveAmount.isPending}>Save amount</Button>
        </DetailDrawer>
      ) : null}
    </AdminShell>
  );
}
