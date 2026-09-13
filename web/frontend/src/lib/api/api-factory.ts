import type { AsaPhisApi } from "@/lib/api/contracts";
import { createMockApi } from "@/lib/api/mock-api";
import { demoData } from "@/lib/mock-data";
import { apiFetch, isRealApiEnabled } from "@/lib/api/http-client";
import { mapBackendToPublicContent, type BackendPublishedResponse } from "@/lib/api/content-mapper";

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
      return apiFetch("/me");
    },
    async getEducation(query) {
      const params = new URLSearchParams();
      if (query.category) params.set("category", query.category);
      if (query.search) params.set("search", query.search);
      const q = params.toString();
      return apiFetch(`/content/education${q ? `?${q}` : ""}`);
    },
    async getVideos() {
      try {
        const items = await apiFetch<{ id: string; title: string; body?: string; mediaUrls?: string[] }[]>("/content/published");
        const list = Array.isArray(items) ? (items as unknown as { items?: unknown[] }) : null;
        const raw: unknown[] = Array.isArray(items) ? (items as unknown[]) : Array.isArray((list as { items?: unknown[] } | null)?.items) ? ((list as { items: unknown[] }).items) : [];
        const videos = raw.filter((r) => {
          const rec = r as { title?: string; mediaUrls?: string[] };
          const t = `${rec.title ?? ""} ${(rec.mediaUrls ?? []).join(" ")}`.toLowerCase();
          return t.includes("video") || t.includes(".mp4");
        });
        if (videos.length > 0) {
          return videos.map((v, i) => {
            const rec = v as { id: string; title: string; body?: string; mediaUrls?: string[] };
            const media = rec.mediaUrls?.[0];
            return { id: rec.id ?? `video-${i}`, category: "Education", kind: "Video", title: rec.title, description: rec.body ?? "", imageUrl: undefined, imageAlt: rec.title, visibility: "public", publishedAt: new Date().toISOString().slice(0, 10), videoUrl: media } as never;
          });
        }
      } catch {
        // fall through to mock below
      }
      return mock.getVideos();
    },
    async getDocuments() {
      try {
        const items = await apiFetch<{ id: string; title: string; body?: string }[]>("/content/education?search=");
        if (Array.isArray(items) && items.length > 0) {
          return (items as unknown as { id: string; title: string; body?: string }[]).map((d) => ({ id: d.id, title: d.title, description: d.body ?? "", category: "Document", updatedAt: new Date().toISOString().slice(0, 10) }) as never);
        }
      } catch {
        // fall through
      }
      return mock.getDocuments();
    },
    async requestDocumentDownload(id) {
      return apiFetch(`/files/${encodeURIComponent(id)}/url`);
    },
    async getNotifications() {
      return apiFetch("/notifications");
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
      try {
        return await apiFetch("/support/requests");
      } catch {
        return mock.listSupportRequests();
      }
    },
    async getPaymentConfig() {
      try {
        return await apiFetch("/payments/config");
      } catch {
        return mock.getPaymentConfig();
      }
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
