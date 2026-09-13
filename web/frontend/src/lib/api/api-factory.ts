import type { AsaPhisApi } from "@/lib/api/contracts";
import { createMockApi } from "@/lib/api/mock-api";
import { demoData } from "@/lib/mock-data";
import { apiFetch, isRealApiEnabled } from "@/lib/api/http-client";
import { mapBackendToPublicContent, type BackendPublishedResponse } from "@/lib/api/content-mapper";
import type { MemberProfile, NotificationRecord, Resource, SubmissionRecord, SupportRequest, TravelRequest } from "@/lib/types";

const SUBMISSION_STATUS: Record<string, SubmissionRecord["status"]> = {
  DRAFT: "Draft",
  UNDER_REVIEW: "Under Review",
  APPROVED: "Approved",
  SCHEDULED: "Scheduled",
  PUBLISHED: "Published",
  REJECTED: "Rejected",
  CHANGES_REQUESTED: "Changes Requested",
};

function mapSubmissionStatus(value: unknown): SubmissionRecord["status"] {
  const key = String(value ?? "").trim().toUpperCase().replace(/[\s-]+/g, "_");
  return SUBMISSION_STATUS[key] ?? "Draft";
}

function mapTravelStatus(value: unknown): TravelRequest["status"] {
  const key = String(value ?? "").trim().toUpperCase();
  if (key === "APPROVED") return "Approved";
  if (key === "REJECTED") return "Rejected";
  if (key === "EXPIRED" || key === "REVOKED") return "Expired";
  return "Pending";
}

function initialsOf(name: string): string {
  return name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "M";
}

export function mapBackendMember(raw: unknown): MemberProfile {
  const r = (raw ?? {}) as {
    email?: string; accountStatus?: string; phoneVerified?: boolean;
    identityStatus?: string;
    member?: {
      displayName?: string; initials?: string; memberCode?: string;
      currentCountry?: string | null; citizenshipCountry?: string | null;
      joinedAt?: string; trustStatus?: string;
    } | null;
  };
  const member = r.member ?? {};
  const name = (member.displayName ?? "").trim() || (r.email ?? "").split("@")[0] || "Member";
  const accountStatus = String(r.accountStatus ?? "").toUpperCase() === "ACTIVE" ? "active" as const : "limited" as const;
  const identityOk = String(r.identityStatus ?? "").toUpperCase() === "VERIFIED";
  return {
    name,
    initials: (member.initials ?? "").trim() || initialsOf(name),
    memberId: member.memberCode ?? "",
    country: ((member.currentCountry || member.citizenshipCountry || "Nigeria") as MemberProfile["country"]),
    joinedAt: member.joinedAt ?? new Date().toISOString(),
    identityVerified: identityOk,
    phoneVerified: Boolean(r.phoneVerified),
    accountStatus,
  };
}

const RESOURCE_KINDS = ["Article", "Video", "Brief", "Document"] as const;

function mapContentRow(row: unknown): Resource {
  const r = (row ?? {}) as {
    id?: string; title?: string; body?: string; kind?: string;
    mediaUrls?: string[]; visibility?: string; publishedAt?: string; createdAt?: string;
  };
  const kind = (RESOURCE_KINDS as readonly string[]).includes(String(r.kind)) ? (r.kind as Resource["kind"]) : "Article";
  const media = Array.isArray(r.mediaUrls) ? r.mediaUrls[0] : undefined;
  return {
    id: String(r.id ?? ""),
    category: "Education",
    kind,
    title: String(r.title ?? "Untitled"),
    description: String(r.body ?? ""),
    imageUrl: media,
    imageAlt: String(r.title ?? "Resource"),
    visibility: String(r.visibility ?? "").toUpperCase() === "MEMBER" ? "member" : "public",
    publishedAt: (r.publishedAt ?? r.createdAt ?? new Date().toISOString()).slice(0, 10),
  };
}

function fileTypeOf(url: string | undefined): string {
  const m = (url ?? "").toLowerCase().match(/\.([a-z0-9]{2,4})(?:[?#]|$)/);
  return m ? m[1].toUpperCase() : "Article";
}

// Real API adapter implementing the same AsaPhisApi contract.
// When NEXT_PUBLIC_API_BASE_URL is empty -> falls back to mock so
// old content keeps serving. When set -> calls real backend.
function createRealApi(): AsaPhisApi {
  const mock = createMockApi(demoData);
  return {
    async getPublishedLandingContent() {
      try {
        const data = await apiFetch<BackendPublishedResponse>("/content/published");
        return mapBackendToPublicContent(data);
      } catch {
        return mock.getPublishedLandingContent();
      }
    },
    async login(input) {
      return apiFetch("/auth/login", { method: "POST", body: JSON.stringify(input) });
    },
    async register(input) {
      return apiFetch("/auth/register", { method: "POST", body: JSON.stringify({ ...input, termsAccepted: true, privacyAccepted: true }) });
    },
    async requestPasswordReset(email) {
      try {
        return await apiFetch("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) });
      } catch {
        return { ok: true };
      }
    },
    async resetPassword(input) {
      return apiFetch("/auth/reset-password", { method: "POST", body: JSON.stringify(input) });
    },
    async changePassword(input) {
      return apiFetch("/auth/change-password", { method: "POST", body: JSON.stringify(input) });
    },
    async logout() {
      try {
        await apiFetch("/auth/logout", { method: "POST" });
      } catch {
        // ignore - clear locally anyway
      }
      return { success: true };
    },
    async detectCurrentCountry() {
      try {
        const data = await apiFetch<{ country?: string; code?: string }>("/onboarding/detect-country");
        const country = (data.country ?? "Nigeria") as never;
        return { country, source: "ip" as const };
      } catch {
        return mock.detectCurrentCountry();
      }
    },
    async sendPhoneCode(input) {
      return apiFetch("/onboarding/phone/send", { method: "POST", body: JSON.stringify(input) });
    },
    async verifyPhoneCode(input) {
      return apiFetch("/onboarding/phone/verify", { method: "POST", body: JSON.stringify(input) });
    },
    async getCountryConfig(country) {
      try {
        return await apiFetch(`/onboarding/country-config/${encodeURIComponent(country)}`);
      } catch {
        return mock.getCountryConfig(country);
      }
    },
    async submitIdentity(input) {
      return apiFetch("/onboarding/identity/submit", { method: "POST", body: JSON.stringify(input) });
    },
    async runSecurityCheck() {
      return apiFetch("/onboarding/security-check", { method: "POST", body: JSON.stringify({}) });
    },
    async createContribution(input) {
      return apiFetch("/onboarding/contribution", { method: "POST", body: JSON.stringify(input) });
    },
    async getActivationStatus() {
      return apiFetch("/onboarding/activation");
    },
    async getMemberProfile() {
      return mapBackendMember(await apiFetch("/me"));
    },
    async getEducation(query) {
      const params = new URLSearchParams();
      if (query.category) params.set("category", query.category);
      if (query.search) params.set("search", query.search);
      const q = params.toString();
      return apiFetch(`/content/education${q ? `?${q}` : ""}`);
    },
    async getVideos() {
      // Real backend only — empty stays empty so the UI shows an honest empty state.
      const data = await apiFetch<{ items?: unknown[] } | unknown[]>("/content/published");
      const raw: unknown[] = Array.isArray(data) ? data : Array.isArray((data as { items?: unknown[] })?.items) ? (data as { items: unknown[] }).items : [];
      return raw
        .filter((r) => {
          const rec = r as { kind?: string; title?: string; mediaUrls?: string[] };
          if (String(rec.kind ?? "").toLowerCase() === "video") return true;
          const t = `${rec.title ?? ""} ${(rec.mediaUrls ?? []).join(" ")}`.toLowerCase();
          return t.includes(".mp4");
        })
        .map((v) => {
          const base = mapContentRow(v);
          const rec = v as { mediaUrls?: string[] };
          return { ...base, kind: "Video" as const, videoUrl: rec.mediaUrls?.[0] } as never;
        });
    },
    async getDocuments() {
      // Real backend only — empty stays empty so the UI shows an honest empty state.
      const items = await apiFetch<unknown[]>("/content/education?search=");
      if (!Array.isArray(items)) return [];
      return items.map((d) => {
        const base = mapContentRow(d);
        const rec = d as { mediaUrls?: string[] };
        return { id: base.id, title: base.title, description: base.description, category: base.category, publishedAt: base.publishedAt, fileType: fileTypeOf(rec.mediaUrls?.[0]), authorization: "allowed" as const };
      });
    },
    async requestDocumentDownload(id) {
      return apiFetch(`/files/${encodeURIComponent(id)}/url`);
    },
    async getNotifications(category) {
      const q = category ? `?category=${encodeURIComponent(category)}` : "";
      const items = await apiFetch<unknown[]>(`/notifications${q}`);
      if (!Array.isArray(items)) return [];
      return (items as NotificationRecord[]).map((n) => ({
        id: String(n.id),
        category: (n.category ?? "Updates") as NotificationRecord["category"],
        title: String(n.title ?? "Notification"),
        body: String(n.body ?? ""),
        createdAt: String(n.createdAt ?? new Date().toISOString()),
        read: Boolean(n.read),
      }));
    },
    async listSubmissions() {
      const items = await apiFetch<unknown[]>("/community/submissions");
      if (!Array.isArray(items)) return [];
      return items.map((s) => {
        const r = s as { id?: string; title?: string; body?: string; status?: string; reviewerNote?: string; updatedAt?: string; createdAt?: string };
        return {
          id: String(r.id ?? ""),
          title: String(r.title ?? "Untitled"),
          body: String(r.body ?? ""),
          status: mapSubmissionStatus(r.status),
          adminMessage: r.reviewerNote ?? undefined,
          updatedAt: String(r.updatedAt ?? r.createdAt ?? new Date().toISOString()),
        } as SubmissionRecord;
      });
    },
    async listTravelRequests() {
      const items = await apiFetch<unknown[]>("/travel/requests");
      if (!Array.isArray(items)) return [];
      return items.map((t) => {
        const r = t as { id?: string; destination?: string; startDate?: string; endDate?: string; reason?: string; additionalInformation?: string; status?: string; grants?: { endsAt?: string }[] };
        return {
          id: String(r.id ?? ""),
          destination: String(r.destination ?? ""),
          startDate: String(r.startDate ?? "").slice(0, 10),
          endDate: String(r.endDate ?? "").slice(0, 10),
          reason: String(r.reason ?? ""),
          additionalInformation: r.additionalInformation ?? undefined,
          status: mapTravelStatus(r.status),
          expiresAt: r.grants?.[0]?.endsAt,
        } as TravelRequest;
      });
    },
    async listDevices() {
      const items = await apiFetch<unknown[]>("/me/devices");
      if (!Array.isArray(items)) return [];
      return items.filter((d) => !(d as { revokedAt?: string }).revokedAt).map((d) => {
        const r = d as { id?: string; label?: string; deviceType?: string; os?: string; browser?: string; lastIp?: string; lastCountry?: string; lastSeenAt?: string; trusted?: boolean };
        const label = r.label || [r.deviceType, r.os, r.browser].filter(Boolean).join(" · ") || "Device";
        return {
          id: String(r.id ?? ""),
          label,
          detail: `${r.lastIp ?? "Unknown IP"}${r.lastCountry ? ` · ${r.lastCountry}` : ""} · Last seen ${r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleString() : "recently"}`,
          trusted: Boolean(r.trusted),
        };
      });
    },
    async listSessions() {
      const items = await apiFetch<unknown[]>("/me/sessions");
      if (!Array.isArray(items)) return [];
      return items.map((s) => {
        const r = s as { id?: string; ip?: string; lastActiveAt?: string };
        return {
          id: String(r.id ?? ""),
          label: `Session · ${r.ip ?? "unknown IP"}`,
          detail: `Last active ${r.lastActiveAt ? new Date(r.lastActiveAt).toLocaleString() : "recently"}`,
        };
      });
    },
    async terminateSession(id) {
      return apiFetch(`/me/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    async revokeDevice(id) {
      return apiFetch(`/me/devices/${encodeURIComponent(id)}`, { method: "DELETE" });
    },
    async submitCommunityContribution(input) {
      return apiFetch("/community/submissions", { method: "POST", body: JSON.stringify(input) });
    },
    async createTravelRequest(input) {
      return apiFetch("/travel/requests", { method: "POST", body: JSON.stringify(input) });
    },
    async createSupportRequest(input) {
      return apiFetch("/support/requests", { method: "POST", body: JSON.stringify(input) });
    },
    async listSupportRequests() {
      // Real backend only — empty stays empty so the UI shows an honest empty state.
      const items = await apiFetch<unknown[]>("/support/requests");
      if (!Array.isArray(items)) return [];
      return items.map((t) => {
        const r = t as {
          id?: string; category?: string; subject?: string; status?: string; createdAt?: string;
          messages?: { author?: string; authorRole?: string; body?: string; createdAt?: string }[];
        };
        const st = String(r.status ?? "").toUpperCase();
        return {
          id: String(r.id ?? ""),
          category: (r.category ?? "Other") as SupportRequest["category"],
          subject: String(r.subject ?? "Support request"),
          message: String(r.messages?.[0]?.body ?? ""),
          status: st === "RESOLVED" || st === "CLOSED" ? ("resolved" as const) : st === "IN_PROGRESS" || st === "PENDING" ? ("pending" as const) : ("open" as const),
          createdAt: String(r.createdAt ?? new Date().toISOString()),
          responses: (r.messages ?? []).slice(1).map((m) => ({
            author: m.authorRole === "member" ? "You" : "Support",
            body: String(m.body ?? ""),
            createdAt: String(m.createdAt ?? ""),
          })),
        } as SupportRequest;
      });
    },
    async getPaymentConfig() {
      // Real backend only — no mock fallback inside the member area.
      const data = await apiFetch<unknown>("/payments/config");
      const list = Array.isArray(data) ? data : data ? [data] : [];
      return list.map((c) => {
        const r = c as { countryCode?: string; currency?: string; amount?: number | string; providers?: string[]; methods?: string[] };
        return {
          countryCode: String(r.countryCode ?? "GLOBAL"),
          currency: String(r.currency ?? "USD"),
          amount: Number(r.amount ?? 0),
          providers: Array.isArray(r.providers) ? r.providers : [],
          methods: Array.isArray(r.methods) ? r.methods : [],
        };
      });
    },
    async listUpdates() {
      // Real published content only (non-education sections) — empty stays empty.
      const data = await apiFetch<BackendPublishedResponse>("/content/published");
      const items = Array.isArray((data as { items?: unknown })?.items) ? (data as { items: unknown[] }).items : [];
      return items
        .filter((it) => String((it as { section?: string }).section ?? "") !== "Education")
        .map((it) => {
          const r = it as { id?: string; title?: string; body?: string; publishedAt?: string; createdAt?: string };
          return {
            id: String(r.id ?? ""),
            title: String(r.title ?? "Update"),
            body: String(r.body ?? ""),
            date: String(r.publishedAt ?? r.createdAt ?? new Date().toISOString()),
          };
        });
    },
    async uploadFile(kind, file) {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
      if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
      const raw = typeof window !== "undefined" ? window.localStorage.getItem("asaphis-session") : null;
      const token = raw ? (JSON.parse(raw) as { token?: string }).token : null;
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${base}/api/v1/files/upload/${encodeURIComponent(kind)}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: form,
      });
      if (!res.ok) throw new Error(`Upload failed (${res.status})`);
      return res.json();
    },
  };
}

export function createApi(): AsaPhisApi {
  if (isRealApiEnabled()) return createRealApi();
  return createMockApi(demoData);
}
