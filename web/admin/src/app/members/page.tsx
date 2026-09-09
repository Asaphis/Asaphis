"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { FilterSelect, QueryState, SearchInput, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";

const countries = ["All", "Nigeria", "Ghana", "Kenya", "United Kingdom", "United States"];
const identity = ["All", "pending", "processing", "verified", "rejected", "needs-review", "failed"];
const accounts = ["All", "active", "limited", "suspended", "banned"];
const trust = ["All", "trusted", "standard", "watch", "restricted"];

const label = (v: string) => v.split("-").map((p) => p[0].toUpperCase() + p.slice(1)).join(" ");

export default function MembersPage() {
  const api = useAdminApi();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("All");
  const [identityStatus, setIdentityStatus] = useState("All");
  const [accountStatus, setAccountStatus] = useState("All");
  const [trustStatus, setTrustStatus] = useState("All");

  const query = useQuery({
    queryKey: ["admin-members", search, country, identityStatus, accountStatus, trustStatus],
    queryFn: () => api.listMembers({ search, country, identityStatus, accountStatus, trustStatus }),
  });

  return (
    <AdminShell title="Members" subtitle="Search by member ID, name, email, phone, country, or status.">
      <SectionCard title="Member directory" intro={query.data ? `${query.data.length} members match.` : undefined}>
        <div className="admin-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search ID, name, email, phone…" label="Search members" />
          <FilterSelect label="Country" value={country} onChange={setCountry} options={countries} />
          <FilterSelect label="Verification" value={identityStatus} onChange={setIdentityStatus} options={identity} />
          <FilterSelect label="Account" value={accountStatus} onChange={setAccountStatus} options={accounts} />
          <FilterSelect label="Trust" value={trustStatus} onChange={setTrustStatus} options={trust} />
        </div>
        <QueryState loading={query.isLoading} error={query.error} empty={!query.data || query.data.length === 0} emptyText="No members match these filters." onRetry={() => query.refetch()}>
          <div className="admin-table-wrap">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Identity</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Trust</TableHead>
                  <TableHead className="text-right">Open</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(query.data ?? []).map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <span className="admin-row-main">{m.name}</span>
                      <span className="admin-row-sub">{m.id} · {m.country}</span>
                    </TableCell>
                    <TableCell>
                      <span className="admin-row-main">{m.email}</span>
                      <span className="admin-row-sub">{m.phone}</span>
                    </TableCell>
                    <TableCell><StatusBadge status={label(m.identityStatus)} /></TableCell>
                    <TableCell><StatusBadge status={label(m.accountStatus)} /></TableCell>
                    <TableCell><StatusBadge status={label(m.trustStatus)} /></TableCell>
                    <TableCell className="text-right">
                      <Link className="admin-link-btn" href={`/members/${m.id}`}>Open</Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </QueryState>
      </SectionCard>
    </AdminShell>
  );
}
