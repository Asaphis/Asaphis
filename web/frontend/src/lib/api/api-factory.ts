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
      return apiFetch("/content/published").then(() => mock.getVideos());
    },
    async getDocuments() {
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
  };
}

export function createApi(): AsaPhisApi {
  if (isRealApiEnabled()) return createRealApi();
  return createMockApi(demoData);
}
