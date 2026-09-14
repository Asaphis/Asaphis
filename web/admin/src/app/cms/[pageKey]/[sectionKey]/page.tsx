"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell } from "@/components/admin/AdminShell";
import { DetailDrawer, DetailRow, QueryState, SectionCard } from "@/components/admin/widgets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { useAdminApi } from "@/lib/use-admin-api";
import { getCmsPage, isVideoUrl, locationOf } from "@/lib/cms-pages";
import type { ContentItem } from "@/lib/admin-types";

function MediaPreview({ url }: { url: string }) {
  if (isVideoUrl(url)) {
    // eslint-disable-next-line jsx-a11y/media-has-caption
    return <video src={url} controls preload="metadata" playsInline style={{ width: "100%", maxHeight: 220, borderRadius: 8, background: "#000" }} />;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt="" loading="lazy" style={{ width: "100%", maxHeight: 220, objectFit: "cover", borderRadius: 8 }} />;
}

// CMS -> Page -> Section -> Contents in position (sortOrder) order.
// Every field shows where it appears: Public Website → Page → Section → Field.
export default function CmsSectionDetail() {
  const params = useParams<{ pageKey: string; sectionKey: string }>();
  const pageKey = String(params?.pageKey ?? "home");
  const sectionKey = String(params?.sectionKey ?? "hero");
  const page = getCmsPage(pageKey);
  const api = useAdminApi();
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ title: "", body: "", kind: "Article", mediaUrls: "", visibility: "PUBLIC", status: "DRAFT", sortOrder: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ title: "", body: "", mediaUrls: "", kind: "Article", visibility: "PUBLIC", status: "draft", sortOrder: 0 });
  const [sectionTitle, setSectionTitle] = useState("");
  const [versionsFor, setVersionsFor] = useState<string | null>(null);

  const sectionsQuery = useQuery({ queryKey: ["cms-sections"], queryFn: () => api.listLandingSections() });
  const itemsQuery = useQuery({ queryKey: ["admin-content"], queryFn: () => api.listContent() });
  const versionsQuery = useQuery({
    queryKey: ["admin-versions", versionsFor],
    queryFn: () => api.listContentVersions(versionsFor!),
    enabled: Boolean(versionsFor),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-content"] });
    queryClient.invalidateQueries({ queryKey: ["cms-sections"] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ContentItem["status"] }) => api.updateContentStatus(id, status),
    onSettled: invalidate,
  });

  const saveEdit = useMutation({
    mutationFn: () =>
      api.updateContent(editingId!, {
        title: editForm.title,
        body: editForm.body,
        mediaUrls: editForm.mediaUrls.split(",").map((s) => s.trim()).filter(Boolean),
        kind: editForm.kind,
        visibility: editForm.visibility,
        status: editForm.status,
        sortOrder: Number(editForm.sortOrder) || 0,
      }),
    onSuccess: () => {
      setEditingId(null);
      invalidate();
    },
  });

  const create = useMutation({
    mutationFn: () =>
      api.createContent({
        section: sectionKey,
        kind: createForm.kind,
        title: createForm.title,
        body: createForm.body,
        mediaUrls: createForm.mediaUrls.split(",").map((s) => s.trim()).filter(Boolean),
        visibility: createForm.visibility,
        status: createForm.status,
        sortOrder: Number(createForm.sortOrder) || 0,
      }),
    onSuccess: () => {
      setShowCreate(false);
      setCreateForm({ title: "", body: "", kind: "Article", mediaUrls: "", visibility: "PUBLIC", status: "DRAFT", sortOrder: 0 });
      invalidate();
    },
  });

  const toggleSection = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) => api.updateLandingSection(id, { visible }),
    onSettled: invalidate,
  });

  const renameSection = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) => api.updateLandingSection(id, { title }),
    onSettled: () => {
      setSectionTitle("");
      invalidate();
    },
  });

  const restore = useMutation({
    mutationFn: ({ contentId, version }: { contentId: string; version: number }) => api.restoreContentVersion(contentId, version),
    onSettled: () => {
      setVersionsFor(null);
      invalidate();
    },
  });

  const openEdit = (item: ContentItem) => {
    setEditingId(item.id);
    setEditForm({
      title: item.title ?? "",
      body: (item as { body?: string }).body ?? "",
      mediaUrls: (item.mediaUrls ?? []).join(", "),
      kind: item.kind ?? "Article",
      visibility: String(item.visibility ?? "PUBLIC").toUpperCase(),
      status: String(item.status ?? "draft").toLowerCase(),
      sortOrder: item.sortOrder ?? 0,
    });
  };

  if (!page) {
    return (
      <AdminShell title="CMS" subtitle="Unknown page.">
        <SectionCard title="Page not found">
          <Link href="/cms"><Button size="sm" variant="outline">Back to Pages</Button></Link>
        </SectionCard>
      </AdminShell>
    );
  }

  const section = (sectionsQuery.data ?? []).find((s) => s.key.toLowerCase() === sectionKey.toLowerCase());
  const contents = [...(itemsQuery.data ?? [])]
    .filter((c) => c.section?.toLowerCase() === sectionKey.toLowerCase())
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  const loading = sectionsQuery.isLoading || itemsQuery.isLoading;
  const error = sectionsQuery.error ?? itemsQuery.error;

  return (
    <AdminShell
      title={`CMS → ${page.title} → ${section?.title ?? sectionKey}`}
      subtitle={`${locationOf(pageKey, section?.title ?? sectionKey)} · position order controls public rendering.`}
    >
      <SectionCard
        title={`Section — ${section?.title ?? sectionKey}`}
        intro={`Appears on → Public Website → ${page.title} → ${section?.title ?? sectionKey}. ${section?.visible === false ? "Currently hidden from the public site." : "Currently visible on the public site."} Preview: ${page.publicPath}`}
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <Link href={`/cms/${page.key}`}><Button size="sm" variant="outline">All Sections</Button></Link>
            <a href={page.publicPath} target="_blank" rel="noreferrer"><Button size="sm" variant="outline">Preview Page</Button></a>
          </div>
        }
      >
        <QueryState loading={loading} error={error} empty={false} emptyText="" onRetry={() => { sectionsQuery.refetch(); itemsQuery.refetch(); }}>
          <Card style={{ padding: 14, display: "grid", gap: 10, marginBottom: 12 }}>
            <DetailRow label="Content Location">
              <span>{locationOf(pageKey, section?.title ?? sectionKey)}</span>
            </DetailRow>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "end" }}>
              <div style={{ display: "grid", gap: 4 }}>
                <Label htmlFor="cms-section-title">Section display title</Label>
                <Input id="cms-section-title" value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder={section?.title ?? sectionKey} style={{ minWidth: 240 }} />
              </div>
              <Button size="sm" variant="outline" disabled={!section || !sectionTitle.trim() || renameSection.isPending} onClick={() => section && renameSection.mutate({ id: section.id, title: sectionTitle.trim() })}>
                Save Title
              </Button>
              {section ? (
                <Button size="sm" variant="outline" onClick={() => toggleSection.mutate({ id: section.id, visible: !section.visible })}>
                  {section.visible ? "Hide Section" : "Show Section"}
                </Button>
              ) : null}
              <span><StatusBadge status={section ? (section.visible ? "Published" : "Hidden") : "Published"} /></span>
            </div>
          </Card>

          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Contents in this section ({contents.length})</h3>
            <Button size="sm" onClick={() => setShowCreate((v) => !v)}>{showCreate ? "Close" : "＋ New content"}</Button>
          </div>

          {showCreate ? (
            <Card style={{ padding: 14, display: "grid", gap: 10, marginBottom: 12 }}>
              <DetailRow label="Content Location"><span>{locationOf(pageKey, section?.title ?? sectionKey, "New content")}</span></DetailRow>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <Label htmlFor="cms-new-title">Title / Heading (appears on → {section?.title ?? sectionKey} → Title)</Label>
                  <Input id="cms-new-title" value={createForm.title} onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })} placeholder="Content title" />
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <Label htmlFor="cms-new-body">Description / Body (appears on → {section?.title ?? sectionKey} → Description)</Label>
                  <Textarea id="cms-new-body" value={createForm.body} onChange={(e) => setCreateForm({ ...createForm, body: e.target.value })} rows={3} placeholder="Description or body text" />
                </div>
                <div style={{ display: "grid", gap: 4 }}>
                  <Label htmlFor="cms-new-media">Media — image/video URLs, comma-separated (first video = main video; poster first for Featured Message)</Label>
                  <Textarea id="cms-new-media" value={createForm.mediaUrls} onChange={(e) => setCreateForm({ ...createForm, mediaUrls: e.target.value })} rows={2} placeholder=https://…poster.jpg, https://…video.mp4" />
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <label style={{ fontSize: 13 }}>Kind
                    <select value={createForm.kind} onChange={(e) => setCreateForm({ ...createForm, kind: e.target.value })}>
                      {["Article", "Video", "Hero", "Brief", "News", "Document"].map((k) => <option key={k} value={k}>{k}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 13 }}>Visibility
                    <select value={createForm.visibility} onChange={(e) => setCreateForm({ ...createForm, visibility: e.target.value })}>
                      {["PUBLIC", "MEMBER", "TRUSTED"].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 13 }}>Status
                    <select value={createForm.status} onChange={(e) => setCreateForm({ ...createForm, status: e.target.value })}>
                      {["DRAFT", "PUBLISHED", "HIDDEN", "SCHEDULED"].map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </label>
                  <label style={{ fontSize: 13 }}>Position
                    <Input type="number" value={createForm.sortOrder} onChange={(e) => setCreateForm({ ...createForm, sortOrder: Number(e.target.value) })} style={{ width: 90 }} />
                  </label>
                </div>
                <div>
                  <Button size="sm" disabled={!createForm.title.trim() || create.isPending} onClick={() => create.mutate()}>
                    {create.isPending ? "Creating…" : "Create in this section"}
                  </Button>
                </div>
              </div>
            </Card>
          ) : null}

          {contents.length === 0 ? (
            <p style={{ fontSize: 13, opacity: 0.7 }}>No contents in this section yet. Create the first one above — it will render in position order on {page.publicPath}.</p>
          ) : null}

          <div style={{ display: "grid", gap: 12 }}>
            {contents.map((item, i) => (
              <Card key={item.id} style={{ padding: 14, display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <strong style={{ fontVariantNumeric: "tabular-nums", opacity: 0.8 }}>{String(i + 1).padStart(2, "0")}</strong>
                    <div style={{ display: "grid", gap: 2 }}>
                      <strong>{item.title}</strong>
                      <span style={{ fontSize: 12, opacity: 0.7 }}>
                        {locationOf(pageKey, section?.title ?? sectionKey, item.kind)} · position {item.sortOrder} · {item.kind}
                      </span>
                      <span><StatusBadge status={String(item.status).charAt(0).toUpperCase() + String(item.status).slice(1)} /></span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <Button size="sm" variant="outline" onClick={() => openEdit(item)}>Edit</Button>
                    {String(item.status).toLowerCase() !== "published"
                      ? <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: item.id, status: "published" })}>Publish</Button>
                      : <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: item.id, status: "hidden" })}>Hide</Button>}
                    <Button size="sm" variant="ghost" onClick={() => setVersionsFor(item.id)}>Versions</Button>
                  </div>
                </div>

                {(item as { body?: string }).body ? <p style={{ fontSize: 13 }}>{(item as { body?: string }).body}</p> : null}

                {(item.mediaUrls ?? []).length > 0 ? (
                  <div style={{ display: "grid", gap: 8 }}>
                    {(item.mediaUrls ?? []).map((url) => (
                      <div key={url} style={{ display: "grid", gap: 4 }}>
                        <MediaPreview url={url} />
                        <span style={{ fontSize: 11, opacity: 0.7, wordBreak: "break-all" }}>
                          {isVideoUrl(url) ? "Video" : "Image"} · Used in → {locationOf(pageKey, section?.title ?? sectionKey, item.title)} · {url.length > 90 ? `${url.slice(0, 90)}…` : url}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span style={{ fontSize: 12, opacity: 0.6 }}>No media attached.</span>
                )}

                <span style={{ fontSize: 11, opacity: 0.6 }}>Updated {item.updatedAt} · {item.updatedBy}</span>
              </Card>
            ))}
          </div>
        </QueryState>
      </SectionCard>

      {editingId ? (
        <DetailDrawer title="Edit content" subtitle={locationOf(pageKey, section?.title ?? sectionKey, editForm.title || "Content")} onClose={() => setEditingId(null)}>
          <div style={{ display: "grid", gap: 10 }}>
            <DetailRow label="Content Location"><span>{locationOf(pageKey, section?.title ?? sectionKey, "Title / Description / Media")}</span></DetailRow>
            <div style={{ display: "grid", gap: 4 }}>
              <Label htmlFor="cms-edit-title">Title / Heading</Label>
              <Input id="cms-edit-title" value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <Label htmlFor="cms-edit-body">Description / Body</Label>
              <Textarea id="cms-edit-body" value={editForm.body} onChange={(e) => setEditForm({ ...editForm, body: e.target.value })} rows={4} />
            </div>
            <div style={{ display: "grid", gap: 4 }}>
              <Label htmlFor="cms-edit-media">Media URLs (comma-separated — poster first, video second for Featured Message)</Label>
              <Textarea id="cms-edit-media" value={editForm.mediaUrls} onChange={(e) => setEditForm({ ...editForm, mediaUrls: e.target.value })} rows={3} />
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <label style={{ fontSize: 13 }}>Kind
                <select value={editForm.kind} onChange={(e) => setEditForm({ ...editForm, kind: e.target.value })}>
                  {["Article", "Video", "Hero", "Brief", "News", "Document"].map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13 }}>Visibility
                <select value={editForm.visibility} onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}>
                  {["PUBLIC", "MEMBER", "TRUSTED"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13 }}>Status
                <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                  {["draft", "published", "hidden", "scheduled", "archived"].map((v) => <option key={v} value={v}>{v}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 13 }}>Position
                <Input type="number" value={editForm.sortOrder} onChange={(e) => setEditForm({ ...editForm, sortOrder: Number(e.target.value) })} style={{ width: 90 }} />
              </label>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" disabled={saveEdit.isPending} onClick={() => saveEdit.mutate()}>{saveEdit.isPending ? "Saving…" : "Save"}</Button>
              <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
            </div>
            <p style={{ fontSize: 12, opacity: 0.7 }}>Saving creates a new version + audit log. Publish to update {page.publicPath}.</p>
          </div>
        </DetailDrawer>
      ) : null}

      {versionsFor ? (
        <DetailDrawer title="Version history" subtitle={versionsFor} onClose={() => setVersionsFor(null)}>
          {(versionsQuery.data ?? []).map((v) => (
            <div key={v.id} style={{ borderBottom: "1px solid var(--border)", padding: "10px 0", display: "grid", gap: 4 }}>
              <DetailRow label={`Version ${v.version}`}><span>{v.changedAt} · {v.changedBy}</span></DetailRow>
              <p style={{ fontSize: 12, opacity: 0.75 }}>{v.summary}</p>
              <div>
                <Button size="sm" variant="outline" onClick={() => restore.mutate({ contentId: versionsFor, version: v.version })}>Restore this version</Button>
              </div>
            </div>
          ))}
          {(versionsQuery.data ?? []).length === 0 ? <p style={{ fontSize: 13, opacity: 0.7 }}>No versions recorded yet.</p> : null}
        </DetailDrawer>
      ) : null}
    </AdminShell>
  );
}
