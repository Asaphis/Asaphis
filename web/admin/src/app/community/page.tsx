"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AdminShell } from "@/components/admin/AdminShell";
import { QueryState, SectionCard } from "@/components/admin/widgets";
import { useAdminApi } from "@/lib/use-admin-api";

export default function CommunityPage() {
  const api = useAdminApi();
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({ whatsapp: "", telegram: "", description: "", postingRules: "", commentRules: "", submissionRequirements: "", moderationPolicy: "" });
  const [saved, setSaved] = useState(false);

  const query = useQuery({ queryKey: ["admin-community"], queryFn: () => api.getCommunitySettings() });

  const save = useMutation({
    mutationFn: () => api.updateCommunitySettings(Object.fromEntries(Object.entries(draft).filter(([, v]) => v.trim() !== ""))),
    onSuccess: () => {
      setSaved(true);
      setDraft({ whatsapp: "", telegram: "", description: "", postingRules: "", commentRules: "", submissionRequirements: "", moderationPolicy: "" });
      queryClient.invalidateQueries({ queryKey: ["admin-community"] });
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const current = query.data;

  return (
    <AdminShell title="Community" subtitle="Links, descriptions, posting rules, and moderation policy.">
      <QueryState loading={query.isLoading} error={query.error} empty={!current} emptyText="Community settings unavailable." onRetry={() => query.refetch()}>
        {current ? (
          <div className="admin-two-col">
            <SectionCard title="Live settings" intro="What members see today.">
              <div className="admin-timeline">
                <div className="admin-timeline-item"><strong>WhatsApp</strong><span>{current.whatsapp}</span></div>
                <div className="admin-timeline-item"><strong>Telegram</strong><span>{current.telegram}</span></div>
                <div className="admin-timeline-item"><strong>Description</strong><span>{current.description}</span></div>
                <div className="admin-timeline-item"><strong>Posting rules</strong><span>{current.postingRules}</span></div>
                <div className="admin-timeline-item"><strong>Comment rules</strong><span>{current.commentRules}</span></div>
                <div className="admin-timeline-item"><strong>Submission requirements</strong><span>{current.submissionRequirements}</span></div>
                <div className="admin-timeline-item"><strong>Moderation policy</strong><span>{current.moderationPolicy}</span></div>
              </div>
            </SectionCard>
            <SectionCard title="Update settings" intro="Only filled fields are changed." action={saved ? <span style={{ fontSize: 12, color: "var(--ok)" }}>Saved.</span> : undefined}>
              <div className="form-field">
                <Label htmlFor="c-whatsapp">WhatsApp link</Label>
                <Input id="c-whatsapp" value={draft.whatsapp} onChange={(e) => setDraft({ ...draft, whatsapp: e.target.value })} placeholder={current.whatsapp} />
              </div>
              <div className="form-field">
                <Label htmlFor="c-telegram">Telegram link</Label>
                <Input id="c-telegram" value={draft.telegram} onChange={(e) => setDraft({ ...draft, telegram: e.target.value })} placeholder={current.telegram} />
              </div>
              <div className="form-field">
                <Label htmlFor="c-desc">Community description</Label>
                <Textarea id="c-desc" rows={2} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder={current.description} />
              </div>
              <div className="form-field">
                <Label htmlFor="c-post">Posting rules</Label>
                <Textarea id="c-post" rows={2} value={draft.postingRules} onChange={(e) => setDraft({ ...draft, postingRules: e.target.value })} placeholder={current.postingRules} />
              </div>
              <div className="form-field">
                <Label htmlFor="c-comment">Comment rules</Label>
                <Textarea id="c-comment" rows={2} value={draft.commentRules} onChange={(e) => setDraft({ ...draft, commentRules: e.target.value })} placeholder={current.commentRules} />
              </div>
              <div className="form-field">
                <Label htmlFor="c-sub">Submission requirements</Label>
                <Textarea id="c-sub" rows={2} value={draft.submissionRequirements} onChange={(e) => setDraft({ ...draft, submissionRequirements: e.target.value })} placeholder={current.submissionRequirements} />
              </div>
              <div className="form-field">
                <Label htmlFor="c-mod">Moderation policy</Label>
                <Textarea id="c-mod" rows={2} value={draft.moderationPolicy} onChange={(e) => setDraft({ ...draft, moderationPolicy: e.target.value })} placeholder={current.moderationPolicy} />
              </div>
              <Button type="button" style={{ marginTop: 12 }} onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending ? "Saving…" : "Save changes"}</Button>
            </SectionCard>
          </div>
        ) : null}
      </QueryState>
    </AdminShell>
  );
}
