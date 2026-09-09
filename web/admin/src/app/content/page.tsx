"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AdminShell } from "@/components/admin/AdminShell";
import { DetailDrawer, DetailRow, QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { formatAdminDate, type ContentItem } from "@/lib/admin-types";

const itemTabs = ["Items", "Landing builder", "Version history"];
const label = (v: string) => v[0].toUpperCase() + v.slice(1);

export default function ContentPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("Items");
  const [versionsFor, setVersionsFor] = useState<string | null>(null);

  const items = useQuery({ queryKey: ["admin-content"], queryFn: () => api.listContent() });
  const sections = useQuery({ queryKey: ["admin-sections"], queryFn: () => api.listLandingSections(), enabled: tab === "Landing builder" });
  const versions = useQuery({ queryKey: ["admin-versions", versionsFor], queryFn: () => api.listContentVersions(versionsFor!), enabled: Boolean(versionsFor) });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentItem["status"] }) => api.updateContentStatus(id, status),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-content"] }),
  });

  const moveSection = useMutation({
    mutationFn: async ({ ids }: { ids: string[] }) => api.reorderLandingSections(ids),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-sections"] }),
  });

  const toggleSection = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => api.updateLandingSection(id, { visible }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["admin-sections"] }),
  });

  const restore = useMutation({
    mutationFn: ({ contentId, version }: { contentId: string; version: number }) => api.restoreContentVersion(contentId, version),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-content"] });
      setVersionsFor(null);
    },
  });

  const shift = (list: { id: string }[], index: number, dir: -1 | 1) => {
    const next = [...list];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    moveSection.mutate({ ids: next.map((s) => s.id) });
  };

  return (
    <AdminShell title="Content" subtitle="Manage library items, the landing page structure, and version history.">
      <div className="admin-tabs" role="tablist" aria-label="Content areas">
        {itemTabs.map((t) => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} className={tab === t ? "is-active" : ""} onClick={() => setTab(t)}>{t}</button>
        ))}
      </div>

      {tab === "Items" ? (
        <SectionCard title="Content library" intro="Draft, publish, hide, schedule, or archive any item.">
          <QueryState loading={items.isLoading} error={items.error} empty={!items.data || items.data.length === 0} emptyText="No content items." onRetry={() => items.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items.data ?? []).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><span className="admin-row-main">{item.title}</span><span className="admin-row-sub">{item.kind} · #{item.sortOrder}</span></TableCell>
                      <TableCell>{item.section}</TableCell>
                      <TableCell><StatusBadge status={label(item.status)} /></TableCell>
                      <TableCell><span className="admin-row-sub">{formatAdminDate(item.updatedAt)} · {item.updatedBy}</span></TableCell>
                      <TableCell>
                        <div className="admin-row-actions">
                          {item.status !== "published" ? <Button type="button" size="sm" variant="outline" onClick={() => setStatus.mutate({ id: item.id, status: "published" })}>Publish</Button> : <Button type="button" size="sm" variant="outline" onClick={() => setStatus.mutate({ id: item.id, status: "hidden" })}>Hide</Button>}
                          <Button type="button" size="sm" variant="ghost" onClick={() => setVersionsFor(item.id)}>Versions</Button>
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

      {tab === "Landing builder" ? (
        <SectionCard title="Landing page builder" intro="Reorder sections, hide them, or preview before publishing. Controlled structure — not a free-form designer.">
          <QueryState loading={sections.isLoading} error={sections.error} empty={!sections.data || sections.data.length === 0} emptyText="No landing sections." onRetry={() => sections.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(sections.data ?? []).map((s, i, arr) => (
                    <TableRow key={s.id}>
                      <TableCell>#{s.sortOrder}</TableCell>
                      <TableCell><span className="admin-row-main">{s.title}</span><span className="admin-row-sub">{s.key}</span></TableCell>
                      <TableCell><StatusBadge status={s.visible ? "Published" : "Hidden"} /></TableCell>
                      <TableCell>
                        <div className="admin-row-actions">
                          <Button type="button" size="sm" variant="ghost" aria-label={`Move ${s.title} up`} onClick={() => shift(arr, i, -1)}><ArrowUp size={14} /></Button>
                          <Button type="button" size="sm" variant="ghost" aria-label={`Move ${s.title} down`} onClick={() => shift(arr, i, 1)}><ArrowDown size={14} /></Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => toggleSection.mutate({ id: s.id, visible: !s.visible })}>
                            {s.visible ? <><EyeOff size={13} /> Hide</> : <><Eye size={13} /> Show</>}
                          </Button>
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

      {tab === "Version history" ? (
        <SectionCard title="Version history" intro="Open Versions on any library item to preview and restore earlier states.">
          <QueryState loading={items.isLoading} error={items.error} empty={!items.data || items.data.length === 0} emptyText="No content items." onRetry={() => items.refetch()}>
            <div className="admin-table-wrap">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">History</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(items.data ?? []).slice(0, 6).map((item) => (
                    <TableRow key={item.id}>
                      <TableCell><span className="admin-row-main">{item.title}</span><span className="admin-row-sub">{item.section}</span></TableCell>
                      <TableCell className="text-right"><Button type="button" size="sm" variant="outline" onClick={() => setVersionsFor(item.id)}>View versions</Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </QueryState>
        </SectionCard>
      ) : null}

      {versionsFor ? (
        <DetailDrawer title="Version history" subtitle={versionsFor} onClose={() => setVersionsFor(null)}>
          {(versions.data ?? []).map((v) => (
            <div key={v.id} style={{ borderBottom: "1px solid var(--border)", padding: "10px 0" }}>
              <DetailRow label={`Version ${v.version}`}><span>{formatAdminDate(v.changedAt)} · {v.changedBy}</span></DetailRow>
              <p style={{ fontSize: 12, color: "var(--muted-foreground)" }}>{v.summary}</p>
              <Button type="button" size="sm" variant="outline" style={{ marginTop: 6 }} onClick={() => restore.mutate({ contentId: versionsFor, version: v.version })}>Restore this version</Button>
            </div>
          ))}
          {(versions.data ?? []).length === 0 ? <p className="admin-subtitle">No versions recorded for this item yet.</p> : null}
        </DetailDrawer>
      ) : null}
    </AdminShell>
  );
}
