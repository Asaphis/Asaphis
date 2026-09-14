import type { AdminApi } from "@/lib/api/admin-contracts";
import type { AdminRole } from "@/lib/admin-types";
import {
  adminDevices,
  adminMembers,
  adminNotifications,
  adminRestrictions,
  adminSessions,
  auditEvents,
  contentItems,
  contentVersions,
  countryPayments,
  identityCases,
  landingSections,
  moderatedComments,
  paymentProviders,
  regionCountries,
  securityEvents,
  securityRequests,
  submissions,
  supportTickets,
  travelRequests,
} from "@/lib/admin-mock-data";

const wait = <T,>(value: T, delay = 220) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), delay));

interface MockContext {
  actor: string;
  role: AdminRole;
}

export function createAdminApi(context: MockContext = { actor: "A. Admin", role: "super" }): AdminApi {
  // In-memory working copies so admin actions feel real during the session.
  // Replace this factory with HTTP clients later — component code stays the same.
  const members = [...adminMembers];
  const identity = [...identityCases];
  const content = [...contentItems];
  const sections = [...landingSections];
  const subs = [...submissions];
  const comments = [...moderatedComments];
  const travel = [...travelRequests];
  const providers = [...paymentProviders];
  const countryPay = [...countryPayments];
  const regions = [...regionCountries];
  const notifications = [...adminNotifications];
  const events = [...securityEvents];
  const sessions = [...adminSessions];
  const devices = [...adminDevices];
  const restrictions = [...adminRestrictions];
  const secRequests = [...securityRequests];
  const tickets = [...supportTickets];
  const audit = [...auditEvents];

  let communitySettings = {
    whatsapp: "https://wa.me/2348012345678",
    telegram: "https://t.me/asaphis",
    description: "A moderated home for African education and shared progress.",
    postingRules: "Posts must be specific, sourced, and open to revision.",
    commentRules: "Be kind, stay on topic, cite a source when you can.",
    submissionRequirements: "Title, body, and at least one source or first-person context.",
    moderationPolicy: "Two-person review for rejections; members are notified of every decision.",
  };

  const log = (action: string, target: string) => {
    audit.unshift({
      id: `AUD-${1010 + audit.length}`,
      actor: context.actor,
      role: context.role,
      action,
      target,
      at: new Date().toISOString().slice(0, 10),
    });
  };

  return {
    async getDashboardStats() {
      return wait({
        totalMembers: 12480,
        verifiedMembers: 9312,
        activeMembers: 8204,
        pendingIdentity: identity.filter((c) => ["pending", "needs-review", "processing"].includes(c.status)).length,
        pendingSubmissions: subs.filter((s) => ["pending", "under-review", "changes-requested"].includes(s.status)).length,
        pendingTravel: travel.filter((t) => t.status === "pending").length,
        contributionsTotal: "NGN 48,210,000",
        suspiciousSessions: sessions.filter((s) => s.status === "suspicious").length,
        restrictedAccounts: restrictions.filter((r) => r.active).length,
        recentAlerts: events.slice(0, 4).map((e) => ({ id: e.id, title: `${e.type} · ${e.memberName}`, at: e.detectedAt, risk: e.risk })),
        recentActivity: audit.slice(0, 6).map((a) => ({ id: a.id, actor: a.actor, action: a.action, at: a.at })),
      });
    },

    async listMembers(query) {
      const q = query?.search?.trim().toLowerCase() ?? "";
      return wait(
        members.filter((m) => {
          const matchesSearch =
            !q ||
            `${m.id} ${m.name} ${m.email} ${m.phone} ${m.country}`.toLowerCase().includes(q);
          const matchesCountry = !query?.country || query.country === "All" || m.country === query.country;
          const matchesIdentity = !query?.identityStatus || query.identityStatus === "All" || m.identityStatus === query.identityStatus;
          const matchesAccount = !query?.accountStatus || query.accountStatus === "All" || m.accountStatus === query.accountStatus;
          const matchesTrust = !query?.trustStatus || query.trustStatus === "All" || m.trustStatus === query.trustStatus;
          return matchesSearch && matchesCountry && matchesIdentity && matchesAccount && matchesTrust;
        }),
      );
    },
    async getMember(id) {
      const found = members.find((m) => m.id === id);
      if (!found) throw new Error("Member not found");
      return wait(found);
    },
    async listAdmins() {
      return wait([]);
    },

    async listIdentityCases(status) {
      return wait(!status || status === "All" ? identity : identity.filter((c) => c.status === status));
    },
    async getIdentityCase(id) {
      const found = identity.find((c) => c.id === id);
      if (!found) throw new Error("Case not found");
      return wait(found);
    },
    async reviewIdentityCase(id, action, note) {
      const c = identity.find((x) => x.id === id);
      if (!c) throw new Error("Case not found");
      const next = action === "approve" ? "verified" : action === "reject" ? "rejected" : action === "manual-review" ? "processing" : "needs-review";
      c.status = next as typeof c.status;
      c.reviewedAt = new Date().toISOString().slice(0, 10);
      c.reviewHistory.push({ by: context.actor, action, at: c.reviewedAt, note });
      log(`${action} identity case ${id}`, c.memberId);
      return wait({ ...c });
    },

    async listContent() {
      return wait([...content].sort((a, b) => a.sortOrder - b.sortOrder));
    },
    async createContent(input) {
      const item = {
        id: `content-${Date.now()}`,
        section: input.section,
        kind: input.kind ?? "Article",
        title: input.title,
        body: input.body ?? "",
        mediaUrls: input.mediaUrls ?? [],
        visibility: (input.visibility ?? "PUBLIC") as never,
        status: (input.status ?? "draft") as never,
        sortOrder: input.sortOrder ?? content.length + 1,
        updatedAt: new Date().toISOString().slice(0, 10),
        updatedBy: context.actor,
      } as never;
      content.push(item as never);
      log(`Created content ${input.title}`, input.section);
      return wait({ ...(item as object) } as never);
    },
    async uploadFile() {
      return wait({ fileId: `file-${Date.now()}`, fileToken: `file-${Date.now()}`, objectKey: `content/mock-${Date.now()}` });
    },
    async deleteContent(id) {
      const idx = content.findIndex((c) => c.id === id);
      if (idx >= 0) content.splice(idx, 1);
      log(`Deleted content ${id}`, "");
      return wait({ ok: true });
    },
    async updateContent(id, patch) {
      const item = content.find((c) => c.id === id);
      if (!item) throw new Error("Content not found");
      Object.assign(item, patch, { updatedAt: new Date().toISOString().slice(0, 10), updatedBy: context.actor });
      log(`Edited content ${item.title}`, `Public Website -> Home -> ${item.section}`);
      return wait({ ...item });
    },
    async updateContentStatus(id, status) {
      const item = content.find((c) => c.id === id);
      if (!item) throw new Error("Content not found");
      item.status = status;
      item.updatedAt = new Date().toISOString().slice(0, 10);
      item.updatedBy = context.actor;
      log(`Set content ${id} to ${status}`, item.title);
      return wait({ ...item });
    },
    async reorderContent(ids) {
      ids.forEach((id, index) => {
        const item = content.find((c) => c.id === id);
        if (item) item.sortOrder = index + 1;
      });
      log("Reordered content sections", `${ids.length} items`);
      return wait([...content].sort((a, b) => a.sortOrder - b.sortOrder));
    },
    async listLandingSections() {
      return wait([...sections].sort((a, b) => a.sortOrder - b.sortOrder));
    },
    async updateLandingSection(id, patch) {
      const s = sections.find((x) => x.id === id);
      if (!s) throw new Error("Section not found");
      Object.assign(s, patch, { updatedAt: new Date().toISOString().slice(0, 10) });
      log(`Updated landing section ${s.title}`, s.key);
      return wait({ ...s });
    },
    async reorderLandingSections(ids) {
      ids.forEach((id, index) => {
        const s = sections.find((x) => x.id === id);
        if (s) s.sortOrder = index + 1;
      });
      log("Reordered landing page", `${ids.length} sections`);
      return wait([...sections].sort((a, b) => a.sortOrder - b.sortOrder));
    },
    async listContentVersions(contentId) {
      return wait(contentVersions.filter((v) => v.contentId === contentId));
    },
    async restoreContentVersion(contentId, version) {
      const item = content.find((c) => c.id === contentId);
      if (!item) throw new Error("Content not found");
      item.updatedAt = new Date().toISOString().slice(0, 10);
      item.updatedBy = context.actor;
      log(`Restored content ${contentId} to version ${version}`, item.title);
      return wait({ ...item });
    },

    async listSocialPosts() {
      return wait([]);
    },
    async reviewSocialPost(id) {
      log(`Reviewed social post ${id}`, "");
      return wait({ id, authorName: "", body: "", mediaUrls: [], mediaKind: "text", visibility: "MEMBERS", status: "PUBLISHED", likeCount: 0, commentCount: 0, repostCount: 0, createdAt: new Date().toISOString() } as never);
    },
    async listReports() {
      return wait([]);
    },
    async reviewReport(id) {
      log(`Reviewed report ${id}`, "");
      return wait({ id, targetKind: "post", targetId: "", reason: "", status: "RESOLVED", createdAt: new Date().toISOString() } as never);
    },
    async listSubmissions(status) {
      return wait(!status || status === "All" ? subs : subs.filter((s) => s.status === status));
    },
    async reviewSubmission(id, action, note) {
      const s = subs.find((x) => x.id === id);
      if (!s) throw new Error("Submission not found");
      const map = { approve: "approved", reject: "rejected", "request-changes": "changes-requested", schedule: "scheduled", publish: "published" } as const;
      s.status = map[action];
      if (note) s.reviewerNote = note;
      log(`${action} submission ${id} — member notified`, s.memberId);
      return wait({ ...s });
    },
    async listComments(filter) {
      return wait(!filter || filter === "All" ? comments : comments.filter((c) => c.status === filter.toLowerCase()));
    },
    async reviewComment(id, action) {
      const c = comments.find((x) => x.id === id);
      if (!c) throw new Error("Comment not found");
      if (action === "delete") {
        const index = comments.indexOf(c);
        comments.splice(index, 1);
        log(`Deleted comment ${id}`, c.memberId);
        return wait({ ...c });
      }
      c.status = action === "approve" ? "approved" : "hidden";
      log(`${action} comment ${id}`, c.memberId);
      return wait({ ...c });
    },

    async listTravelRequests() {
      return wait([...travel]);
    },
    async reviewTravelRequest(id, action, note) {
      const t = travel.find((x) => x.id === id);
      if (!t) throw new Error("Request not found");
      const map = { approve: "approved", reject: "rejected", revoke: "revoked", "request-verification": "pending" } as const;
      t.status = map[action];
      void note;
      log(`${action} travel request ${id}`, t.memberId);
      return wait({ ...t });
    },

    async listCountryPayments() {
      return wait([...countryPay]);
    },
    async updateCountryPayment(country, patch) {
      const c = countryPay.find((x) => x.country === country);
      if (!c) throw new Error("Country not found");
      Object.assign(c, patch);
      log(`Updated payment config for ${country}`, country);
      return wait({ ...c });
    },
    async listProviders() {
      return wait([...providers].sort((a, b) => a.priority - b.priority));
    },
    async toggleProvider(id, enabled) {
      const p = providers.find((x) => x.id === id);
      if (!p) throw new Error("Provider not found");
      p.enabled = enabled;
      log(`${enabled ? "Enabled" : "Disabled"} provider ${p.name}`, p.id);
      return wait({ ...p });
    },
    async testProvider(id) {
      const p = providers.find((x) => x.id === id);
      if (!p) throw new Error("Provider not found");
      p.lastTestedAt = new Date().toISOString().slice(0, 10);
      p.lastTestResult = p.secretConfigured ? "ok" : "failed";
      log(`Tested provider connectivity for ${p.name}`, p.id);
      return wait({ ...p });
    },

    async listCountries() {
      return wait([...regions]);
    },
    async updateCountry(country, patch) {
      const c = regions.find((x) => x.country === country);
      if (!c) throw new Error("Country not found");
      Object.assign(c, patch);
      log(`Updated region rules for ${country}`, country);
      return wait({ ...c });
    },

    async listNotifications() {
      return wait([...notifications]);
    },
    async createNotification(input) {
      const item = {
        ...input,
        id: `NT-${510 + notifications.length}`,
        status: (input.scheduledFor ? "scheduled" : "sent") as "scheduled" | "sent",
        sentAt: input.scheduledFor ? undefined : new Date().toISOString().slice(0, 10),
        createdBy: context.actor,
      };
      notifications.unshift(item);
      log(`Created notification ${item.id}`, item.audience);
      return wait(item);
    },

    async listSecurityEvents() {
      return wait([...events]);
    },
    async updateSecurityEvent(id, status) {
      const e = events.find((x) => x.id === id);
      if (!e) throw new Error("Event not found");
      e.status = status;
      log(`Marked risk event ${id} as ${status}`, e.memberId);
      return wait({ ...e });
    },
    async listSessions() {
      return wait([...sessions]);
    },
    async terminateSession(id) {
      const s = sessions.find((x) => x.id === id);
      if (!s) throw new Error("Session not found");
      s.status = "terminated";
      log(`Terminated session ${id}`, s.memberId);
      return wait({ ...s });
    },
    async listDevices() {
      return wait([...devices]);
    },
    async listRestrictions() {
      return wait([...restrictions]);
    },
    async applyRestriction(input) {
      const member = members.find((m) => m.id === input.memberId);
      const item = {
        ...input,
        id: `RST-${50 + restrictions.length}`,
        memberName: member?.name ?? input.memberId,
        appliedBy: context.actor,
        appliedAt: new Date().toISOString().slice(0, 10),
        active: true,
      };
      restrictions.unshift(item);
      log(`Applied ${input.type} to ${input.memberId}`, input.reason);
      return wait(item);
    },
    async liftRestriction(id) {
      const r = restrictions.find((x) => x.id === id);
      if (!r) throw new Error("Restriction not found");
      r.active = false;
      log(`Lifted restriction ${id}`, r.memberId);
      return wait({ ...r });
    },
    async listSecurityRequests() {
      return wait([...secRequests]);
    },
    async listAuditEvents() {
      return wait([...audit]);
    },
    async listFeatureFlags() {
      return wait([]);
    },
    async setFeatureFlag(key, enabled) {
      return wait({ key, enabled });
    },
    async getAppSettings() {
      return wait({});
    },
    async setAppSetting() {
      return wait(undefined);
    },

    async getCommunitySettings() {
      return wait({ ...communitySettings });
    },
    async updateCommunitySettings(patch) {
      communitySettings = { ...communitySettings, ...patch };
      log("Updated community settings", "Community");
      return wait({ ...communitySettings });
    },

    async listTickets(status) {
      return wait(!status || status === "All" ? tickets : tickets.filter((t) => t.status === status));
    },
    async replyTicket(id, body) {
      const t = tickets.find((x) => x.id === id);
      if (!t) throw new Error("Ticket not found");
      t.messages.push({ author: context.actor, body, at: new Date().toISOString().slice(0, 10) });
      t.updatedAt = new Date().toISOString().slice(0, 10);
      log(`Replied to ticket ${id}`, t.memberId);
      return wait({ ...t });
    },
    async updateTicketStatus(id, status) {
      const t = tickets.find((x) => x.id === id);
      if (!t) throw new Error("Ticket not found");
      t.status = status;
      t.updatedAt = new Date().toISOString().slice(0, 10);
      log(`Set ticket ${id} to ${status}`, t.memberId);
      return wait({ ...t });
    },

    async getAnalytics() {
      return wait({
        memberGrowth: [
          { label: "Apr", value: 1820 },
          { label: "May", value: 2640 },
          { label: "Jun", value: 3910 },
          { label: "Jul", value: 6230 },
          { label: "Aug", value: 9480 },
          { label: "Sep", value: 12480 },
        ],
        verificationRate: 74.6,
        activeMembers: 8204,
        contentEngagement: 31240,
        videoViews: 18412,
        educationEngagement: 12828,
        communitySubmissions: 342,
        moderation: { approved: 218, rejected: 41, pending: 83 },
        contributions: [
          { label: "NGN", value: 38200000 },
          { label: "GHS", value: 412000 },
          { label: "KES", value: 1180000 },
          { label: "GBP", value: 18400 },
          { label: "USD", value: 22100 },
        ],
        countryDistribution: [
          { label: "Nigeria", value: 6840 },
          { label: "Ghana", value: 2310 },
          { label: "Kenya", value: 1890 },
          { label: "UK", value: 860 },
          { label: "US", value: 580 },
        ],
      });
    },
  };
}
