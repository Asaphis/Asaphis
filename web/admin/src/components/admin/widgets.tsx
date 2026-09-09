"use client";

import { useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { StateStrip } from "@/components/shared/StateStrip";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "ok" | "warn" | "danger" }) {
  return (
    <Card className="admin-stat">
      <p className="admin-stat-label">{label}</p>
      <strong className={cn("admin-stat-value", tone === "warn" && "tone-warn", tone === "danger" && "tone-danger", tone === "ok" && "tone-ok")}>{value}</strong>
      {hint ? <span className="admin-stat-hint">{hint}</span> : null}
    </Card>
  );
}

export function SectionCard({ title, intro, action, children, className }: { title: string; intro?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("admin-section", className)}>
      <div className="admin-section-head">
        <div>
          <h2>{title}</h2>
          {intro ? <p>{intro}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </Card>
  );
}

export function SearchInput({ value, onChange, placeholder, label }: { value: string; onChange: (v: string) => void; placeholder: string; label: string }) {
  return (
    <div className="admin-search">
      <Search size={16} aria-hidden="true" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label} />
    </div>
  );
}

export function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <label className="admin-filter">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </label>
  );
}

export function ConfirmDialog({ title, body, confirmLabel, danger, onConfirm, onCancel, busy }: { title: string; body: string; confirmLabel: string; danger?: boolean; onConfirm: () => void; onCancel: () => void; busy?: boolean }) {
  return (
    <div className="admin-dialog-overlay" role="alertdialog" aria-modal="true" aria-label={title} onClick={onCancel}>
      <div className="admin-dialog" onClick={(e) => e.stopPropagation()}>
        <h2>{title}</h2>
        <p>{body}</p>
        <div className="form-field">
          <Label htmlFor="confirm-note">Note for the audit log (optional)</Label>
          <Textarea id="confirm-note" rows={2} placeholder="Why is this action needed?" />
        </div>
        <div className="admin-dialog-actions">
          <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="button" className={danger ? "admin-danger" : "admin-primary"} onClick={onConfirm} disabled={busy}>
            {busy ? "Working…" : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DetailDrawer({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="admin-drawer-overlay" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
      <div className="admin-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="admin-drawer-head">
          <div>
            <p className="eyebrow">Detail</p>
            <h2>{title}</h2>
            {subtitle ? <p className="admin-subtitle">{subtitle}</p> : null}
          </div>
          <Button type="button" variant="outline" onClick={onClose}>Close</Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="admin-detail-row">
      <span>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function BarList({ items, format }: { items: { label: string; value: number }[]; format?: (v: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="admin-bars">
      {items.map((item) => (
        <div key={item.label} className="admin-bar-row">
          <span className="admin-bar-label">{item.label}</span>
          <div className="admin-bar-track">
            <div className="admin-bar-fill" style={{ width: `${Math.round((item.value / max) * 100)}%` }} />
          </div>
          <strong>{format ? format(item.value) : item.value.toLocaleString()}</strong>
        </div>
      ))}
    </div>
  );
}

export function QueryState({ loading, error, empty, emptyText, onRetry, children }: { loading: boolean; error: unknown; empty: boolean; emptyText: string; onRetry: () => void; children: ReactNode }) {
  if (loading) return <StateStrip state="loading" message="Loading…" />;
  if (error) return <StateStrip state="error" message="Something went wrong loading this data." onRetry={onRetry} />;
  if (empty) return <StateStrip state="empty" message={emptyText} />;
  return <>{children}</>;
}

export function Pill({ children, tone }: { children: ReactNode; tone?: "ok" | "warn" | "danger" | "muted" }) {
  return <Badge variant="outline" className={cn("admin-pill", tone === "ok" && "pill-ok", tone === "warn" && "pill-warn", tone === "danger" && "pill-danger")}>{children}</Badge>;
}

export function NoteForm({ onSubmit, busy, placeholder }: { onSubmit: (note: string) => void; busy?: boolean; placeholder?: string }) {
  const [note, setNote] = useState("");
  return (
    <form
      className="admin-note-form"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(note);
        setNote("");
      }}
    >
      <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={placeholder ?? "Add a reviewer note…"} aria-label="Reviewer note" />
      <Button type="submit" variant="outline" disabled={busy}>{busy ? "Saving…" : "Save note"}</Button>
    </form>
  );
}

export { StatusBadge };
