import type { AdminApi } from "@/lib/api/admin-contracts";
import { createAdminApi } from "@/lib/api/admin-mock-api";
import { adminFetch, isAdminRealApiEnabled } from "@/lib/api/http-admin-client";

// Real admin adapter: same AdminApi signatures, calls backend.
// Falls back to mock when env missing or request fails so UI never breaks
// during migration. Content/video publishing goes to:
// POST /content, PATCH /content/:id/status, GET /content/admin,
// GET /content/:id/versions, POST /content/:id/restore/:v
function createRealAdminApi(): AdminApi {
  const fallback = createAdminApi({ actor: "A. Admin", role: "super" });
  const withFallback = async <T>(fn: () => Promise<T>, fb: () => Promise<T>): Promise<T> => {
    try {
      return await fn();
    } catch {
      return fb();
    }
  };
  return {
    getDashboardStats: () => withFallback(() => adminFetch("/admin/dashboard"), () => fallback.getDashboardStats()),
    listMembers: (q) => {
      const p = new URLSearchParams();
      if (q?.search) p.set("search", q.search);
      if (q?.country) p.set("country", q.country);
      const s = p.toString();
      return withFallback(() => adminFetch(`/admin/members${s ? `?${s}` : ""}`), () => fallback.listMembers(q));
    },
    getMember: (id) => withFallback(() => adminFetch(`/admin/members/${id}`), () => fallback.getMember(id)),
    listIdentityCases: (s) => withFallback(() => adminFetch(`/identity/cases${s ? `?status=${s}` : ""}`), () => fallback.listIdentityCases(s)),
    getIdentityCase: (id) => withFallback(() => adminFetch(`/identity/cases`), () => fallback.getIdentityCase(id)).then((v) => (Array.isArray(v) ? (v as never[])[0] : v) as never) as never,
    reviewIdentityCase: (id, action, note) => withFallback(() => adminFetch(`/identity/cases/${id}/review`, { method: "POST", body: JSON.stringify({ action, note }) }), () => fallback.reviewIdentityCase(id, action, note)),
    listContent: () => withFallback(() => adminFetch("/content/admin"), () => fallback.listContent()),
    createContent: (input) => withFallback(() => adminFetch("/content", { method: "POST", body: JSON.stringify(input) }), () => fallback.createContent(input)),
    uploadFile: (kind, file) => {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
      if (!base) return fallback.uploadFile(kind, file);
      const run = async () => {
        const token = typeof window !== "undefined" ? window.localStorage.getItem("asaphis-admin-token") : null;
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
      };
      return withFallback(run, () => fallback.uploadFile(kind, file));
    },
    deleteContent: (id) => withFallback(() => adminFetch(`/content/${id}`, { method: "DELETE" }).then(() => ({ ok: true })), () => fallback.deleteContent(id)),
    updateContentStatus: (id, status) => {
      const map: Record<string, string> = { published: "PUBLISHED", hidden: "HIDDEN", draft: "DRAFT", scheduled: "SCHEDULED", archived: "ARCHIVED" };
      return withFallback(() => adminFetch(`/content/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: map[status] ?? status }) }), () => fallback.updateContentStatus(id, status));
    },
    reorderContent: (ids) => fallback.reorderContent(ids),
    listLandingSections: () => withFallback(() => adminFetch("/settings/public").then(() => fallback.listLandingSections()), () => fallback.listLandingSections()),
    updateLandingSection: (id, patch) => withFallback(() => adminFetch(`/settings/${id}`, { method: "PUT", body: JSON.stringify(patch) }).then(() => fallback.updateLandingSection(id, patch)), () => fallback.updateLandingSection(id, patch)),
    reorderLandingSections: (ids) => fallback.reorderLandingSections(ids),
    listContentVersions: (cid) => withFallback(() => adminFetch(`/content/${cid}/versions`), () => fallback.listContentVersions(cid)),
    restoreContentVersion: (cid, v) => withFallback(() => adminFetch(`/content/${cid}/restore/${v}`, { method: "POST" }), () => fallback.restoreContentVersion(cid, v)),
    listSubmissions: (s) => withFallback(() => adminFetch("/community/admin/submissions"), () => fallback.listSubmissions(s)),
    reviewSubmission: (id, action, note) => withFallback(() => adminFetch(`/community/admin/submissions/${id}/review`, { method: "POST", body: JSON.stringify({ action, note }) }), () => fallback.reviewSubmission(id, action, note)),
    listComments: (f) => withFallback(() => adminFetch("/community/admin/comments"), () => fallback.listComments(f)),
    reviewComment: (id, action) => withFallback(() => adminFetch(`/community/admin/comments/${id}/review`, { method: "POST", body: JSON.stringify({ action }) }), () => fallback.reviewComment(id, action)),
    listTravelRequests: () => withFallback(() => adminFetch("/travel/admin/requests"), () => fallback.listTravelRequests()),
    reviewTravelRequest: (id, action, note) => withFallback(() => adminFetch(`/travel/admin/requests/${id}/review`, { method: "POST", body: JSON.stringify({ action, note }) }), () => fallback.reviewTravelRequest(id, action, note)),
    listCountryPayments: () => withFallback(() => adminFetch("/payments/admin/countries"), () => fallback.listCountryPayments()),
    updateCountryPayment: (c, patch) => withFallback(() => adminFetch(`/payments/admin/countries/${encodeURIComponent(c)}`, { method: "PATCH", body: JSON.stringify(patch) }), () => fallback.updateCountryPayment(c, patch)),
    listProviders: () => withFallback(() => adminFetch("/admin/providers"), () => fallback.listProviders()),
    toggleProvider: (id, enabled) => withFallback(() => adminFetch(`/admin/providers/${id}/toggle`, { method: "POST", body: JSON.stringify({ enabled }) }), () => fallback.toggleProvider(id, enabled)),
    testProvider: (id) => fallback.testProvider(id),
    listCountries: () => withFallback(() => adminFetch("/countries"), () => fallback.listCountries()),
    updateCountry: (c, patch) => withFallback(() => adminFetch(`/countries/${encodeURIComponent(c)}`, { method: "PATCH", body: JSON.stringify(patch) }), () => fallback.updateCountry(c, patch)),
    listNotifications: () => withFallback(() => adminFetch("/notifications/admin/all"), () => fallback.listNotifications()),
    createNotification: (input) => withFallback(() => adminFetch("/notifications/admin", { method: "POST", body: JSON.stringify(input) }), () => fallback.createNotification(input)),
    listSecurityEvents: () => withFallback(() => adminFetch("/security/events"), () => fallback.listSecurityEvents()),
    updateSecurityEvent: (id, status) => withFallback(() => adminFetch(`/security/events/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }), () => fallback.updateSecurityEvent(id, status)),
    listSessions: () => withFallback(() => adminFetch("/security/sessions"), () => fallback.listSessions()),
    terminateSession: (id) => withFallback(() => adminFetch(`/security/sessions/${id}/terminate`, { method: "POST" }), () => fallback.terminateSession(id)),
    listDevices: () => withFallback(() => adminFetch("/security/devices"), () => fallback.listDevices()),
    listRestrictions: () => withFallback(() => adminFetch("/restrictions"), () => fallback.listRestrictions()),
    applyRestriction: (input) => withFallback(() => adminFetch("/restrictions", { method: "POST", body: JSON.stringify(input) }), () => fallback.applyRestriction(input)),
    liftRestriction: (id) => withFallback(() => adminFetch(`/restrictions/${id}/lift`, { method: "POST" }), () => fallback.liftRestriction(id)),
    listSecurityRequests: () => fallback.listSecurityRequests(),
    listAuditEvents: () => withFallback(() => adminFetch("/audit/admin"), () => fallback.listAuditEvents()),
    getCommunitySettings: () => withFallback(() => adminFetch("/settings/public").then((s) => (s as { community?: never })?.community ?? fallback.getCommunitySettings()), () => fallback.getCommunitySettings()),
    updateCommunitySettings: (patch) => withFallback(() => adminFetch("/settings/community", { method: "PUT", body: JSON.stringify(patch) }).then(() => fallback.updateCommunitySettings(patch)), () => fallback.updateCommunitySettings(patch)),
    listTickets: (s) => withFallback(() => adminFetch(`/support/admin/tickets${s ? `?status=${s}` : ""}`), () => fallback.listTickets(s)),
    replyTicket: (id, body) => withFallback(() => adminFetch(`/support/admin/tickets/${id}/reply`, { method: "POST", body: JSON.stringify({ body }) }), () => fallback.replyTicket(id, body)),
    updateTicketStatus: (id, status) => withFallback(() => adminFetch(`/support/admin/tickets/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }), () => fallback.updateTicketStatus(id, status)),
    getAnalytics: () => withFallback(() => adminFetch("/analytics"), () => fallback.getAnalytics()),
  };
}

export function createAdminApiResolved(actor: string, role: "super" | "security" | "content" | "moderator" | "finance"): AdminApi {
  if (isAdminRealApiEnabled()) return createRealAdminApi();
  return createAdminApi({ actor, role });
}
