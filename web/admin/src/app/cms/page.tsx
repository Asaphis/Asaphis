"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/AdminShell";
import { QueryState, SearchInput, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { CMS_PAGES } from "@/lib/cms-pages";

// CMS -> Pages list. First screen of the landing-page CMS.
// Page -> [Manage] -> sections -> contents. Nothing about posts/friends/feed here.
export default function CmsPagesPage() {
  const api = useAdminApi();
  const [search, setSearch] = useState("");
  const sections = useQuery({ queryKey: ["cms-sections"], queryFn: () => api.listLandingSections() });

  const q = search.trim().toLowerCase();
  const pages = CMS_PAGES.filter((p) => !q || `${p.title} ${p.description} ${p.key}`.toLowerCase().includes(q));

  return (
    <AdminShell title="CMS" subtitle="Landing-page content, page by page. Pick a page to see its sections.">
      <SectionCard
        title="Pages"
        intro="The public website broken down page by page. Home holds the full landing-page sections."
        action={<SearchInput value={search} onChange={setSearch} placeholder="Search pages..." label="Search pages" />}
      >
        <QueryState loading={sections.isLoading} error={sections.error} empty={false} emptyText="" onRetry={() => sections.refetch()}>
          <div style={{ display: "grid", gap: 12 }}>
            {pages.map((page) => {
              const sectionCount =
                page.sectionKeys === "landing"
                  ? (sections.data ?? []).length
                  : page.sectionKeys.length;
              const isHome = page.key === "home";
              return (
                <Card key={page.key} style={{ padding: 16, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div style={{ display: "grid", gap: 4 }}>
                    <strong style={{ fontSize: 16 }}>{page.title}</strong>
                    <span style={{ fontSize: 13, opacity: 0.75 }}>{page.description}</span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      Public Website → {page.title} · {sectionCount} section{sectionCount === 1 ? "" : "s"} · {page.publicPath}
                    </span>
                    <span>
                      <StatusBadge status={isHome ? "Published" : "Published"} />
                    </span>
                  </div>
                  <Link href={`/cms/${page.key}`}>
                    <Button size="sm">Manage</Button>
                  </Link>
                </Card>
              );
            })}
            {pages.length === 0 ? <p style={{ fontSize: 13, opacity: 0.7 }}>No pages match “{search}”.</p> : null}
          </div>
        </QueryState>
      </SectionCard>
    </AdminShell>
  );
}
