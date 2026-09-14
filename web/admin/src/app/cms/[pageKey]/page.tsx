"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AdminShell } from "@/components/admin/AdminShell";
import { QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { getCmsPage } from "@/lib/cms-pages";

// CMS -> Page -> Sections in position order.
// Home resolves sections from live LandingSection rows (backend order).
// Other pages resolve to their single mapped section.
export default function CmsPageDetail() {
  const params = useParams<{ pageKey: string }>();
  const pageKey = String(params?.pageKey ?? "home");
  const page = getCmsPage(pageKey);
  const api = useAdminApi();
  const queryClient = useQueryClient();

  const sectionsQuery = useQuery({ queryKey: ["cms-sections"], queryFn: () => api.listLandingSections() });
  const itemsQuery = useQuery({ queryKey: ["admin-content"], queryFn: () => api.listContent() });

  const toggleSection = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => api.updateLandingSection(id, { visible }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cms-sections"] }),
  });

  const moveSection = useMutation({
    mutationFn: ({ ids }: { ids: string[] }) => api.reorderLandingSections(ids),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["cms-sections"] }),
  });

  if (!page) {
    return (
      <AdminShell title="CMS" subtitle="Unknown page.">
        <SectionCard title="Page not found">
          <p style={{ fontSize: 13 }}>No CMS page named “{pageKey}”.</p>
          <Link href="/cms"><Button size="sm" variant="outline">Back to Pages</Button></Link>
        </SectionCard>
      </AdminShell>
    );
  }

  const allSections = [...(sectionsQuery.data ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
  const pageSections =
    page.sectionKeys === "landing"
      ? allSections
      : page.sectionKeys.map((key, i) => {
          const live = allSections.find((s) => s.key === key);
          return live ?? { id: key, key, title: key, visible: true, sortOrder: i, updatedAt: "" };
        });

  const countFor = (sectionKey: string) =>
    (itemsQuery.data ?? []).filter((c) => c.section?.toLowerCase() === sectionKey.toLowerCase()).length;

  const shift = (index: number, dir: -1 | 1) => {
    const next = [...pageSections];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    moveSection.mutate({ ids: next.map((s) => s.id) });
  };

  return (
    <AdminShell title={`CMS → ${page.title}`} subtitle={`Public Website → ${page.title} (${page.publicPath}). Pick a section to see everything inside it.`}>
      <SectionCard
        title={`${page.title} — Sections`}
        intro={`Position order controls the public rendering order. Hide a section to remove it from ${page.publicPath} without code changes.`}
        action={<Link href="/cms"><Button size="sm" variant="outline">All Pages</Button></Link>}
      >
        <QueryState loading={sectionsQuery.isLoading} error={sectionsQuery.error} empty={pageSections.length === 0} emptyText="No sections for this page yet." onRetry={() => sectionsQuery.refetch()}>
          <div style={{ display: "grid", gap: 10 }}>
            {pageSections.map((s, i) => (
              <Card key={s.id} style={{ padding: 14, display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, opacity: 0.8, minWidth: 34 }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ display: "grid", gap: 2 }}>
                    <strong>{s.title}</strong>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      Appears on → Public Website → {page.title} → {s.title} · key “{s.key}” · {countFor(s.key)} content item{countFor(s.key) === 1 ? "" : "s"}
                    </span>
                    <span><StatusBadge status={s.visible ? "Published" : "Hidden"} /></span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                  {page.sectionKeys === "landing" ? (
                    <>
                      <Button size="sm" variant="ghost" aria-label={`Move ${s.title} up`} onClick={() => shift(i, -1)}><ArrowUp size={14} /></Button>
                      <Button size="sm" variant="ghost" aria-label={`Move ${s.title} down`} onClick={() => shift(i, 1)}><ArrowDown size={14} /></Button>
                      <Button size="sm" variant="outline" onClick={() => toggleSection.mutate({ id: s.id, visible: !s.visible })}>
                        {s.visible ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                      </Button>
                    </>
                  ) : null}
                  <Link href={`/cms/${page.key}/${s.key}`}>
                    <Button size="sm">Open</Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        </QueryState>
      </SectionCard>
    </AdminShell>
  );
}
