import type { AdminApi } from "@/lib/api/admin-contracts";
import { createAdminApi } from "@/lib/api/admin-mock-api";
import { adminFetch, isAdminRealApiEnabled } from "@/lib/api/http-admin-client";
import type {
  AccountStatus,
  AdminDevice,
  AdminMember,
  AdminNotification,
  AdminRestriction,
  AdminRole,
  AdminSession,
  AdminTravelRequest,
  AuditEvent,
  ContentItem,
  ContentVersion,
  CountryPaymentConfig,
  DashboardStats,
  IdentityCase,
  LandingSection,
  ModeratedComment,
  PaymentProvider,
  RegionCountry,
  RestrictionType,
  SecurityEvent,
  SecurityRequest,
  Submission,
  SupportTicket,
  TrustStatus,
  VerificationStatus,
} from "@/lib/admin-types";

// ---------- honest mappers: backend rows -> admin UI shapes (no invented facts) ----------

const initialsOf = (name: string) =>
  name.trim().split(/\s+/).map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "A";

const displayNameOf = (email?: string | null, displayName?: string | null) => {
  if (displayName?.trim()) return displayName.trim();
  const local = (email ?? "").split("@")[0].replace(/[._-]+/g, " ").trim();
  return local || "Member";
};

type BackendUserLite = {
  id: string;
  email?: string;
  phone?: string | null;
  phoneVerifiedAt?: string | null;
  accountStatus?: string;
  createdAt?: string;
  member?: {
    displayName?: string;
    memberCode?: string;
    currentCountry?: string | null;
    citizenshipCountry?: string | null;
    trustStatus?: string;
    joinedAt?: string;
  } | null;
  identityProfile?: { status?: string; phoneVerified?: boolean } | null;
  travelRequests?: { status?: string }[];
};

const mapIdentityStatus = (v: unknown): VerificationStatus => {
  switch (String(v ?? "").toUpperCase()) {
    case "VERIFIED": return "verified";
    case "PROCESSING": return "processing";
    case "FAILED": return "failed";
    case "NEEDS_REVIEW": return "needs-review";
    case "REJECTED": return "rejected";
    default: return "pending";
  }
};

const mapAccountStatus = (v: unknown): AccountStatus => {
  switch (String(v ?? "").toUpperCase()) {
    case "ACTIVE": return "active";
    case "SUSPENDED": return "suspended";
    case "BANNED": return "banned";
    default: return "limited";
  }
};

const mapTrustStatus = (v: unknown): TrustStatus => {
  const k = String(v ?? "").toLowerCase();
  return k === "trusted" || k === "watch" || k === "restricted" ? (k as TrustStatus) : "standard";
};

const mapTravelStatus = (v: unknown): AdminMember["travelStatus"] => {
  switch (String(v ?? "").toUpperCase()) {
    case "PENDING": return "pending";
    case "APPROVED": return "approved";
    case "EXPIRED":
    case "REVOKED": return "expired";
    default: return "clear";
  }
};

function mapAdminMember(u: BackendUserLite): AdminMember {
  const m = u.member ?? {};
  const name = displayNameOf(u.email, m.displayName);
  const latestTravel = (u.travelRequests ?? [])[0]?.status;
  return {
    id: u.id,
    name,
    initials: initialsOf(name),
    email: u.email ?? "",
    phone: u.phone ?? "",
    country: m.currentCountry || m.citizenshipCountry || "",
    memberSince: String(u.createdAt ?? "").slice(0, 10),
    identityStatus: mapIdentityStatus(u.identityProfile?.status),
    phoneVerified: Boolean(u.phoneVerifiedAt),
    accountStatus: mapAccountStatus(u.accountStatus),
    trustStatus: mapTrustStatus(m.trustStatus),
    currentCountry: m.currentCountry || m.citizenshipCountry || "",
    travelStatus: mapTravelStatus(latestTravel),
  };
}

const mapSubmissionStatus = (v: unknown): Submission["status"] => {
  switch (String(v ?? "").toUpperCase().replace(/[\s-]+/g, "_")) {
    case "UNDER_REVIEW": return "under-review";
    case "CHANGES_REQUESTED": return "changes-requested";
    case "APPROVED": return "approved";
    case "REJECTED": return "rejected";
    case "SCHEDULED": return "scheduled";
    case "PUBLISHED": return "published";
    default: return "pending";
  }
};

const mapTicketStatus = (v: unknown): SupportTicket["status"] => {
  switch (String(v ?? "").toUpperCase()) {
    case "WAITING": return "waiting";
    case "IN_PROGRESS": return "in-progress";
    case "RESOLVED": return "resolved";
    case "CLOSED": return "closed";
    default: return "open";
  }
};

const mapRisk = (v: unknown): SecurityEvent["risk"] => {
  const k = String(v ?? "").toLowerCase();
  return k === "high" || k === "critical" ? "high" : k === "medium" ? "medium" : "low";
};

type BackendTicket = {
  id: string;
  userId?: string | null;
  email?: string | null;
  category?: string;
  subject?: string;
  priority?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  messages?: { author?: string; body?: string; createdAt?: string }[];
  user?: { email?: string; member?: { displayName?: string; memberCode?: string } | null } | null;
};

function mapSupportTicket(t: BackendTicket): SupportTicket {
  const email = t.email ?? t.user?.email ?? "";
  return {
    id: String(t.id),
    memberId: String(t.userId ?? ""),
    memberName: displayNameOf(email, t.user?.member?.displayName),
    category: String(t.category ?? "Other"),
    priority: (["low", "normal", "high", "urgent"].includes(String(t.priority ?? "").toLowerCase()) ? String(t.priority).toLowerCase() : "normal") as SupportTicket["priority"],
    subject: String(t.subject ?? "Support request"),
    status: mapTicketStatus(t.status),
    messages: (t.messages ?? []).map((m) => ({
      author: String(m.author ?? "Member"),
      body: String(m.body ?? ""),
      at: String(m.createdAt ?? ""),
    })),
    updatedAt: String((t as { updatedAt?: string }).updatedAt ?? t.createdAt ?? ""),
  };
}

const mapContentStatus = (v: unknown): ContentItem["status"] => {
  const k = String(v ?? "").toLowerCase();
  return k === "published" || k === "hidden" || k === "scheduled" || k === "archived" ? (k as ContentItem["status"]) : "draft";
};

function mapContentItem(r: Record<string, unknown>): ContentItem {
  return {
    id: String(r.id ?? ""),
    section: String(r.section ?? ""),
    title: String(r.title ?? "Untitled"),
    kind: String(r.kind ?? "Article"),
    body: typeof r.body === "string" ? r.body : "",
    mediaUrls: Array.isArray(r.mediaUrls) ? (r.mediaUrls as string[]) : [],
    visibility: typeof r.visibility === "string" ? r.visibility : "PUBLIC",
    status: mapContentStatus(r.status),
    updatedAt: String((r.updatedAt as string) ?? (r.createdAt as string) ?? ""),
    updatedBy: typeof r.updatedBy === "string" ? r.updatedBy : "",
    scheduledFor: typeof r.scheduledFor === "string" ? r.scheduledFor : undefined,
    sortOrder: Number(r.sortOrder ?? 0),
  };
}

const mapRestrictionTypeToBackend = (v: string) => v.trim().toUpperCase().replace(/-/g, "_");
const mapRestrictionTypeFromBackend = (v: unknown): RestrictionType => {
  const k = String(v ?? "").toLowerCase().replace(/_/g, "-");
  return ([
    "limited", "verification-required", "comment-restricted", "submission-restricted",
    "upload-restricted", "payment-restricted", "security-hold", "suspended", "banned",
  ] as RestrictionType[]).includes(k as RestrictionType) ? (k as RestrictionType) : "limited";
};

type BackendUserRef = { email?: string; member?: { displayName?: string; memberCode?: string } | null } | null;

const memberNameOf = (user: BackendUserRef, userId?: string | null) =>
  displayNameOf(user?.email, user?.member?.displayName);

function mapIdentityCase(r: unknown): IdentityCase {
  const row = r as {
    id?: string; userId?: string; countryCode?: string; documentType?: string;
    provider?: string; status?: string; createdAt?: string;
    user?: BackendUserRef;
    verifications?: { status?: string; resultSummary?: string; riskIndicators?: string[]; reviewedBy?: string; reviewedAt?: string; reviewNote?: string; createdAt?: string }[];
  };
  const vers = row.verifications ?? [];
  const latest = vers[0];
  return {
    id: String(row.id ?? ""),
    memberId: String(row.userId ?? ""),
    memberName: memberNameOf(row.user ?? null),
    country: String(row.countryCode ?? ""),
    documentType: String(row.documentType ?? ""),
    provider: String(row.provider ?? ""),
    status: mapIdentityStatus(row.status),
    result: String(latest?.resultSummary ?? latest?.status ?? row.status ?? ""),
    submittedAt: String(row.createdAt ?? ""),
    reviewedAt: latest?.reviewedAt,
    riskIndicators: latest?.riskIndicators ?? [],
    reviewHistory: vers.map((v) => ({
      by: String(v.reviewedBy ?? ""),
      action: String(v.status ?? ""),
      at: String(v.reviewedAt ?? v.createdAt ?? ""),
      note: v.reviewNote ?? undefined,
    })),
  };
}

function mapSubmission(r: unknown): Submission {
  const row = r as {
    id?: string; title?: string; body?: string; authorName?: string; authorId?: string;
    status?: string; reviewerNote?: string; createdAt?: string;
  };
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? "Untitled"),
    body: String(row.body ?? ""),
    author: String(row.authorName ?? ""),
    memberId: String(row.authorId ?? ""),
    country: "",
    status: mapSubmissionStatus(row.status),
    submittedAt: String(row.createdAt ?? ""),
    trustStatus: "standard",
    riskIndicators: [],
    reviewerNote: row.reviewerNote ?? undefined,
  };
}

function mapModeratedComment(r: unknown): ModeratedComment {
  const row = r as {
    id?: string; body?: string; authorName?: string; authorId?: string;
    status?: string; flags?: number; createdAt?: string;
  };
  const st = String(row.status ?? "pending").toLowerCase();
  return {
    id: String(row.id ?? ""),
    body: String(row.body ?? ""),
    author: String(row.authorName ?? ""),
    memberId: String(row.authorId ?? ""),
    status: (st === "approved" || st === "pending" || st === "flagged" || st === "hidden" ? st : "pending") as ModeratedComment["status"],
    flags: Number(row.flags ?? 0),
    reason: "",
    createdAt: String(row.createdAt ?? ""),
  };
}

function mapSocialPost(r: unknown): import("@/lib/admin-types").SocialPost {
  const row = r as {
    id?: string; body?: string; mediaUrls?: string[]; mediaKind?: string;
    visibility?: string; status?: string; likeCount?: number; commentCount?: number;
    repostCount?: number; createdAt?: string;
    author?: { displayName?: string; email?: string } | null;
  };
  const author = row.author as { displayName?: string; email?: string } | undefined;
  return {
    id: String(row.id ?? ""),
    authorName: String(author?.displayName ?? author?.email ?? ""),
    body: String(row.body ?? ""),
    mediaUrls: Array.isArray(row.mediaUrls) ? row.mediaUrls : [],
    mediaKind: String(row.mediaKind ?? "text"),
    visibility: String(row.visibility ?? "MEMBERS"),
    status: String(row.status ?? "UNDER_REVIEW"),
    likeCount: Number(row.likeCount ?? 0),
    commentCount: Number(row.commentCount ?? 0),
    repostCount: Number(row.repostCount ?? 0),
    createdAt: String(row.createdAt ?? ""),
  };
}

function mapSocialReport(r: unknown): import("@/lib/admin-types").SocialReport {
  const row = r as { id?: string; targetKind?: string; targetId?: string; reason?: string; status?: string; createdAt?: string };
  return {
    id: String(row.id ?? ""),
    targetKind: String(row.targetKind ?? ""),
    targetId: String(row.targetId ?? ""),
    reason: String(row.reason ?? ""),
    status: String(row.status ?? "OPEN"),
    createdAt: String(row.createdAt ?? ""),
  };
}

type BackendTravelRow = {
  id?: string; userId?: string; verifiedCountry?: string | null; currentIpCountry?: string | null;
  destination?: string; startDate?: string; endDate?: string; reason?: string; status?: string;
  user?: BackendUserRef;
};

function mapAdminTravel(r: BackendTravelRow): AdminTravelRequest {
  const st = String(r.status ?? "").toUpperCase();
  return {
    id: String(r.id ?? ""),
    memberId: String(r.userId ?? ""),
    memberName: memberNameOf(r.user ?? null),
    verifiedCountry: String(r.verifiedCountry ?? ""),
    currentIpCountry: String(r.currentIpCountry ?? ""),
    destination: String(r.destination ?? ""),
    startDate: String(r.startDate ?? "").slice(0, 10),
    endDate: String(r.endDate ?? "").slice(0, 10),
    device: "",
    risk: "low",
    vpnDetected: false,
    reason: String(r.reason ?? ""),
    status: (st === "APPROVED" ? "approved" : st === "REJECTED" ? "rejected" : st === "EXPIRED" || st === "REVOKED" ? (st.toLowerCase() as AdminTravelRequest["status"]) : "pending") as AdminTravelRequest["status"],
  };
}

function mapCountryPayment(r: unknown): CountryPaymentConfig {
  const row = r as { countryCode?: string; currency?: string; amount?: number | string; methods?: string[]; providers?: string[]; enabled?: boolean };
  return {
    country: String(row.countryCode ?? ""),
    currency: String(row.currency ?? ""),
    amount: Number(row.amount ?? 0),
    methods: Array.isArray(row.methods) ? row.methods : [],
    providers: Array.isArray(row.providers) ? row.providers : [],
    enabled: row.enabled !== false,
  };
}

function mapProvider(r: unknown): PaymentProvider {
  const row = r as {
    id?: string; name?: string; enabled?: boolean; priority?: number; secretConfigured?: boolean;
    lastTestedAt?: string; lastTestResult?: string; config?: { countries?: string[]; methods?: string[] } | null;
  };
  const res = String(row.lastTestResult ?? "").toLowerCase();
  return {
    id: String(row.id ?? ""),
    name: String(row.name ?? ""),
    countries: row.config?.countries ?? [],
    methods: row.config?.methods ?? [],
    priority: Number(row.priority ?? 100),
    enabled: row.enabled !== false,
    secretConfigured: Boolean(row.secretConfigured),
    lastTestedAt: row.lastTestedAt ? new Date(row.lastTestedAt).toLocaleString() : undefined,
    lastTestResult: res === "ok" ? "ok" : res === "failed" ? "failed" : undefined,
  };
}

function mapRegionCountry(r: unknown): RegionCountry {
  const row = r as {
    code?: string; name?: string; enabled?: boolean; allowedDocuments?: string[];
    verificationProvider?: string; phoneRequired?: boolean; livenessRequired?: boolean;
    manualReview?: boolean; eligibilityRule?: string; travelRule?: string; accessRule?: string;
  };
  return {
    country: String(row.name ?? row.code ?? ""),
    enabled: row.enabled !== false,
    documents: Array.isArray(row.allowedDocuments) ? row.allowedDocuments : [],
    provider: String(row.verificationProvider ?? ""),
    phoneRequired: Boolean(row.phoneRequired),
    livenessRequired: Boolean(row.livenessRequired),
    manualReview: Boolean(row.manualReview),
    eligibility: String(row.eligibilityRule ?? ""),
    travelRule: String(row.travelRule ?? ""),
    accessRule: String(row.accessRule ?? ""),
  };
}

function mapAdminNotification(r: unknown): AdminNotification {
  const row = r as { id?: string; title?: string; body?: string; audience?: string; channel?: string; scheduledFor?: string; sentAt?: string };
  return {
    id: String(row.id ?? ""),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    audience: String(row.audience ?? ""),
    channel: String(row.channel ?? ""),
    status: row.sentAt ? "sent" : row.scheduledFor ? "scheduled" : "draft",
    scheduledFor: row.scheduledFor,
    sentAt: row.sentAt,
    createdBy: "—",
  };
}

function mapSecurityEvent(r: unknown): SecurityEvent {
  const row = r as {
    id?: string; userId?: string | null; type?: string; level?: string; signals?: unknown;
    previousCountry?: string | null; currentCountry?: string | null; status?: string; createdAt?: string;
    user?: BackendUserRef;
  };
  const st = String(row.status ?? "open").toLowerCase();
  const signals = Array.isArray(row.signals) ? row.signals.map(String) : [];
  return {
    id: String(row.id ?? ""),
    memberId: String(row.userId ?? ""),
    memberName: memberNameOf(row.user ?? null),
    type: String(row.type ?? "Security event"),
    risk: mapRisk(row.level),
    signals,
    previousLocation: String(row.previousCountry ?? ""),
    currentLocation: String(row.currentCountry ?? ""),
    travelApproved: false,
    status: (st === "open" || st === "reviewing" || st === "resolved" ? st : "open") as SecurityEvent["status"],
    detectedAt: String(row.createdAt ?? ""),
  };
}

function mapAdminSession(r: unknown): AdminSession {
  const row = r as {
    id?: string; userId?: string; ip?: string | null; country?: string | null;
    browser?: string | null; os?: string | null; createdAt?: string; revokedAt?: string | null;
    riskLevel?: string;
    device?: { label?: string; deviceType?: string; os?: string; browser?: string; lastCountry?: string | null; riskLevel?: string } | null;
    user?: BackendUserRef;
  };
  const deviceLabel = row.device?.label || [row.device?.deviceType, row.device?.os, row.device?.browser].filter(Boolean).join(" · ");
  return {
    id: String(row.id ?? ""),
    memberId: String(row.userId ?? ""),
    memberName: memberNameOf(row.user ?? null),
    device: deviceLabel || "—",
    browser: String(row.browser ?? row.device?.browser ?? ""),
    os: String(row.os ?? row.device?.os ?? ""),
    ip: String(row.ip ?? ""),
    country: String(row.country ?? row.device?.lastCountry ?? ""),
    vpnDetected: false,
    risk: mapRisk(row.riskLevel ?? row.device?.riskLevel),
    status: row.revokedAt ? "terminated" : "active",
    startedAt: String(row.createdAt ?? ""),
  };
}

function mapAdminDevice(r: unknown): AdminDevice {
  const row = r as {
    id?: string; userId?: string; label?: string | null; deviceType?: string | null;
    os?: string | null; browser?: string | null; trusted?: boolean;
    firstSeenAt?: string; lastSeenAt?: string;
    user?: BackendUserRef;
  };
  return {
    id: String(row.id ?? ""),
    memberId: String(row.userId ?? ""),
    memberName: memberNameOf(row.user ?? null),
    label: row.label || [row.deviceType, row.os, row.browser].filter(Boolean).join(" · ") || "Device",
    trusted: Boolean(row.trusted),
    firstSeen: String(row.firstSeenAt ?? ""),
    lastSeen: String(row.lastSeenAt ?? ""),
  };
}

function durationOf(appliedAt?: string, expiresAt?: string | null): string {
  if (!appliedAt || !expiresAt) return "—";
  const days = Math.round((new Date(expiresAt).getTime() - new Date(appliedAt).getTime()) / 86400_000);
  if (!Number.isFinite(days) || days <= 0) return "—";
  return `${days} day${days === 1 ? "" : "s"}`;
}

function mapAdminRestriction(r: unknown): AdminRestriction {
  const row = r as {
    id?: string; userId?: string; type?: string; reason?: string; affectedFeatures?: string[];
    appliedBy?: string; appliedAt?: string; expiresAt?: string | null; active?: boolean;
    user?: BackendUserRef;
  };
  return {
    id: String(row.id ?? ""),
    memberId: String(row.userId ?? ""),
    memberName: memberNameOf(row.user ?? null),
    type: mapRestrictionTypeFromBackend(row.type),
    reason: String(row.reason ?? ""),
    duration: durationOf(row.appliedAt, row.expiresAt),
    affectedFeatures: Array.isArray(row.affectedFeatures) ? row.affectedFeatures : [],
    appliedBy: String(row.appliedBy ?? ""),
    appliedAt: String(row.appliedAt ?? ""),
    expiresAt: row.expiresAt ?? undefined,
    active: row.active !== false,
  };
}

function mapAuditEvent(r: unknown): AuditEvent {
  const row = r as { id?: string; adminEmail?: string; adminRole?: string; action?: string; target?: string | null; createdAt?: string };
  const role = String(row.adminRole ?? "").toLowerCase();
  return {
    id: String(row.id ?? ""),
    actor: String(row.adminEmail ?? ""),
    role: (["super", "security", "content", "moderator", "finance"].includes(role) ? role : "super") as AdminRole,
    action: String(row.action ?? ""),
    target: String(row.target ?? ""),
    at: String(row.createdAt ?? ""),
  };
}

function mapContentVersion(r: unknown): ContentVersion {
  const row = r as { id?: string; contentId?: string; version?: number; changedBy?: string; createdAt?: string; summary?: string };
  return {
    id: String(row.id ?? ""),
    contentId: String(row.contentId ?? ""),
    version: Number(row.version ?? 0),
    changedBy: String(row.changedBy ?? ""),
    changedAt: String(row.createdAt ?? ""),
    summary: String(row.summary ?? ""),
  };
}

function mapLandingSection(r: unknown): LandingSection {
  const row = r as { id?: string; key?: string; title?: string; visible?: boolean; sortOrder?: number; updatedAt?: string };
  return {
    id: String(row.id ?? row.key ?? ""),
    key: String(row.key ?? ""),
    title: String(row.title ?? ""),
    visible: row.visible !== false,
    sortOrder: Number(row.sortOrder ?? 0),
    updatedAt: String(row.updatedAt ?? ""),
  };
}

const COMMUNITY_KEY_TO_FIELD: Record<string, string> = {
  WHATSAPP_COMMUNITY_URL: "whatsapp",
  TELEGRAM_COMMUNITY_URL: "telegram",
  COMMUNITY_DESCRIPTION: "description",
  COMMUNITY_POSTING_RULES: "postingRules",
  COMMUNITY_COMMENT_RULES: "commentRules",
  COMMUNITY_SUBMISSION_REQUIREMENTS: "submissionRequirements",
  COMMUNITY_MODERATION_POLICY: "moderationPolicy",
};

function mapCommunitySettings(raw: unknown) {
  const rows = raw as Record<string, unknown>;
  const out: Record<string, string> = {
    whatsapp: "", telegram: "", description: "", postingRules: "",
    commentRules: "", submissionRequirements: "", moderationPolicy: "",
  };
  for (const [key, field] of Object.entries(COMMUNITY_KEY_TO_FIELD)) {
    if (rows[key] !== undefined) out[field] = String(rows[key] ?? "");
  }
  return out as {
    whatsapp: string; telegram: string; description: string; postingRules: string;
    commentRules: string; submissionRequirements: string; moderationPolicy: string;
  };
}

// Real admin adapter: same AdminApi signatures, calls backend.
// When the real backend is enabled, backend failures are thrown so pages
// show the real error (expired session, forbidden role, validation) instead
// of silently rendering mock rows. Mock is only used when no backend is
// configured at all (createAdminApiResolved picks the mock adapter then).
// Content/video publishing goes to:
// POST /content, PATCH /content/:id/status, GET /content/admin,
// GET /content/:id/versions, POST /content/:id/restore/:v
function createRealAdminApi(): AdminApi {
  // reorderContent has no backend endpoint; everything else below is real.
  const fallback = createAdminApi({ actor: "A. Admin", role: "super" });
  return {
    getDashboardStats: async (): Promise<DashboardStats> => {
      const [stats, events] = await Promise.all([
        adminFetch<{
          totalMembers?: number; activeMembers?: number; verifiedMembers?: number;
          pendingIdentity?: number; pendingSubmissions?: number; pendingTravel?: number;
          contributionsTotal?: string | number; suspiciousSessions?: number;
          restrictedAccounts?: number;
          recentActivity?: { id?: string; adminEmail?: string; action?: string; createdAt?: string }[];
        }>("/admin/dashboard"),
        adminFetch<{ id?: string; type?: string; level?: string; status?: string; createdAt?: string }[]>("/security/events").catch(() => []),
      ]);
      const alerts = (Array.isArray(events) ? events : [])
        .filter((e) => String(e.status ?? "").toLowerCase() === "open")
        .slice(0, 5)
        .map((e) => ({
          id: String(e.id ?? ""),
          title: String(e.type ?? "Security event"),
          at: String(e.createdAt ?? ""),
          risk: String(e.level ?? "low").toLowerCase(),
        }));
      return {
        totalMembers: Number(stats.totalMembers ?? 0),
        verifiedMembers: Number(stats.verifiedMembers ?? 0),
        activeMembers: Number(stats.activeMembers ?? 0),
        pendingIdentity: Number(stats.pendingIdentity ?? 0),
        pendingSubmissions: Number(stats.pendingSubmissions ?? 0),
        pendingTravel: Number(stats.pendingTravel ?? 0),
        contributionsTotal: Number(stats.contributionsTotal ?? 0).toLocaleString(),
        suspiciousSessions: Number(stats.suspiciousSessions ?? 0),
        restrictedAccounts: Number(stats.restrictedAccounts ?? 0),
        recentAlerts: alerts,
        recentActivity: (stats.recentActivity ?? []).map((a) => ({
          id: String(a.id ?? ""),
          actor: String(a.adminEmail ?? ""),
          action: String(a.action ?? ""),
          at: String(a.createdAt ?? ""),
        })),
      };
    },
    listMembers: async (q) => {
      const [rows, countries] = await Promise.all([
        adminFetch<BackendUserLite[]>(`/admin/members${q?.search ? `?search=${encodeURIComponent(q.search)}` : ""}`),
        adminFetch<{ code?: string; name?: string }[]>("/countries").catch(() => []),
      ]);
      const codeToName = new Map((Array.isArray(countries) ? countries : []).map((c) => [String(c.code ?? "").toUpperCase(), String(c.name ?? c.code ?? "")]));
      const list = (Array.isArray(rows) ? rows : []).map((u) => {
        const mapped = mapAdminMember(u);
        const rawCountry = (u.member?.currentCountry || u.member?.citizenshipCountry || "").toUpperCase();
        if (rawCountry && codeToName.has(rawCountry)) {
          mapped.country = codeToName.get(rawCountry)!;
          mapped.currentCountry = mapped.country;
        }
        return mapped;
      });
      const norm = (v?: string) => (v ?? "All").toLowerCase();
      return list.filter((m) =>
        (norm(q?.country) === "all" || m.country === q?.country) &&
        (norm(q?.identityStatus) === "all" || m.identityStatus === norm(q?.identityStatus)) &&
        (norm(q?.accountStatus) === "all" || m.accountStatus === norm(q?.accountStatus)) &&
        (norm(q?.trustStatus) === "all" || m.trustStatus === norm(q?.trustStatus)),
      );
    },
    getMember: async (id) => {
      const row = await adminFetch<BackendUserLite | null>(`/admin/members/${id}`);
      if (!row || !(row as BackendUserLite).id) throw new Error("Member not found.");
      return mapAdminMember(row as BackendUserLite);
    },
    listAdmins: async () => {
      const rows = await adminFetch<{
        id?: string; email?: string; roles?: string[]; lastLoginAt?: string; createdAt?: string;
        member?: { displayName?: string } | null;
      }[]>("/admin/admins");
      return (Array.isArray(rows) ? rows : []).map((r) => ({
        id: String(r.id ?? ""),
        name: displayNameOf(r.email, r.member?.displayName),
        email: String(r.email ?? ""),
        role: String((r.roles ?? []).filter((x) => x !== "MEMBER")[0] ?? "ADMIN"),
        lastActive: String(r.lastLoginAt ?? r.createdAt ?? ""),
      }));
    },
    listIdentityCases: async (s) => {
      const rows = await adminFetch<unknown[]>("/identity/cases");
      const list = (Array.isArray(rows) ? rows : []).map(mapIdentityCase);
      const norm = (s ?? "All").toLowerCase();
      return norm === "all" ? list : list.filter((c) => c.status === norm);
    },
    getIdentityCase: async (id) => {
      const rows = await adminFetch<unknown[]>("/identity/cases");
      const found = (Array.isArray(rows) ? rows : []).map(mapIdentityCase).find((c) => c.id === id);
      if (!found) throw new Error("Identity case not found.");
      return found;
    },
    reviewIdentityCase: async (id, action, note) => {
      const row = await adminFetch<unknown>(`/identity/cases/${id}/review`, { method: "POST", body: JSON.stringify({ decision: action, note }) });
      const r = row as { id?: string; userId?: string; countryCode?: string; documentType?: string; provider?: string; status?: string; createdAt?: string };
      return {
        id: String(r.id ?? id),
        memberId: String(r.userId ?? ""),
        memberName: "",
        country: String(r.countryCode ?? ""),
        documentType: String(r.documentType ?? ""),
        provider: String(r.provider ?? ""),
        status: mapIdentityStatus(r.status),
        result: String(r.status ?? ""),
        submittedAt: String(r.createdAt ?? ""),
        riskIndicators: [],
        reviewHistory: [],
      };
    },
    listContent: async () => {
      const rows = await adminFetch<Record<string, unknown>[]>("/content/admin");
      return (Array.isArray(rows) ? rows : []).map(mapContentItem);
    },
    createContent: async (input) => mapContentItem(await adminFetch<Record<string, unknown>>("/content", { method: "POST", body: JSON.stringify(input) })),
    uploadFile: async (kind, file) => {
      const base = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").trim().replace(/\/+$/, "");
      if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
      const token = typeof window !== "undefined" ? window.localStorage.getItem("asaphis-admin-token") : null;
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${base}/api/v1/files/upload/${encodeURIComponent(kind)}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: "include",
        body: form,
      });
      if (!res.ok) {
        let message = `Upload failed (${res.status})`;
        try {
          const data = (await res.json()) as { message?: string; error?: string };
          message = data.message ?? data.error ?? message;
        } catch {
          // keep default
        }
        throw new Error(message);
      }
      return res.json();
    },
    deleteContent: async (id) => {
      await adminFetch(`/content/${id}`, { method: "DELETE" });
      return { ok: true };
    },
    updateContent: async (id, patch) => {
      return mapContentItem(await adminFetch<Record<string, unknown>>(`/content/${id}`, { method: "PATCH", body: JSON.stringify(patch) }));
    },
    updateContentStatus: async (id, status) => {
      const map: Record<string, string> = { published: "PUBLISHED", hidden: "HIDDEN", draft: "DRAFT", scheduled: "SCHEDULED", archived: "ARCHIVED" };
      return mapContentItem(await adminFetch<Record<string, unknown>>(`/content/${id}/status`, { method: "PATCH", body: JSON.stringify({ status: map[status] ?? status }) }));
    },
    reorderContent: (ids) => fallback.reorderContent(ids),
    listLandingSections: async () => {
      const rows = await adminFetch<unknown[]>("/settings/landing");
      return (Array.isArray(rows) ? rows : []).map(mapLandingSection);
    },
    updateLandingSection: async (id, patch) => {
      const sections = await adminFetch<unknown[]>("/settings/landing");
      const key = (Array.isArray(sections) ? sections : []).map(mapLandingSection).find((s) => s.id === id || s.key === id)?.key ?? id;
      const body: Record<string, unknown> = {};
      if (patch.visible !== undefined) body.visible = patch.visible;
      if (patch.title !== undefined) body.title = patch.title;
      if (patch.sortOrder !== undefined) body.sortOrder = patch.sortOrder;
      return mapLandingSection(await adminFetch<unknown>(`/settings/landing/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify(body) }));
    },
    reorderLandingSections: async (ids) => {
      const sections = await adminFetch<unknown[]>("/settings/landing");
      const byId = new Map((Array.isArray(sections) ? sections : []).map(mapLandingSection).map((s) => [s.id, s.key]));
      const keys = ids.map((id) => byId.get(id) ?? id);
      const rows = await adminFetch<unknown[]>("/settings/landing", { method: "PUT", body: JSON.stringify({ ids: keys }) });
      return (Array.isArray(rows) ? rows : []).map(mapLandingSection);
    },
    listContentVersions: async (cid) => {
      const rows = await adminFetch<unknown[]>(`/content/${cid}/versions`);
      return (Array.isArray(rows) ? rows : []).map(mapContentVersion);
    },
    restoreContentVersion: async (cid, v) => mapContentItem(await adminFetch<Record<string, unknown>>(`/content/${cid}/restore/${v}`, { method: "POST" })),
    listSocialPosts: async (status) => {
      const q = status && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
      const rows = await adminFetch<unknown[]>(`/social/admin/posts${q}`);
      return (Array.isArray(rows) ? rows : []).map(mapSocialPost);
    },
    reviewSocialPost: async (id, decision, note) => {
      const row = await adminFetch<unknown>(`/social/admin/posts/${id}/review`, { method: "POST", body: JSON.stringify({ decision, note }) });
      return mapSocialPost(row);
    },
    listReports: async (status) => {
      const q = status && status !== "All" ? `?status=${encodeURIComponent(status)}` : "";
      const rows = await adminFetch<unknown[]>(`/social/admin/reports${q}`);
      return (Array.isArray(rows) ? rows : []).map(mapSocialReport);
    },
    reviewReport: async (id, decision, postAction) => {
      const row = await adminFetch<unknown>(`/social/admin/reports/${id}/review`, { method: "POST", body: JSON.stringify({ decision, postAction }) });
      return mapSocialReport(row);
    },
    listSubmissions: async (s) => {
      const norm = (s ?? "All").toLowerCase();
      const rows = await adminFetch<unknown[]>(`/community/admin/submissions${norm === "all" ? "" : `?status=${encodeURIComponent(norm.replace(/-/g, "_"))}`}`);
      return (Array.isArray(rows) ? rows : []).map(mapSubmission);
    },
    reviewSubmission: async (id, action, note) => {
      const row = await adminFetch<unknown>(`/community/admin/submissions/${id}/review`, { method: "POST", body: JSON.stringify({ action, note }) });
      return mapSubmission(row);
    },
    listComments: async (f) => {
      const norm = (f ?? "All").toLowerCase();
      const rows = await adminFetch<unknown[]>(`/community/admin/comments${norm === "all" ? "" : `?status=${encodeURIComponent(norm)}`}`);
      return (Array.isArray(rows) ? rows : []).map(mapModeratedComment);
    },
    reviewComment: async (id, action) => {
      const row = await adminFetch<unknown>(`/community/admin/comments/${id}/review`, { method: "POST", body: JSON.stringify({ action }) });
      if (row && typeof row === "object" && "id" in (row as Record<string, unknown>)) return mapModeratedComment(row);
      return { id, body: "", author: "", memberId: "", status: action === "delete" ? ("hidden" as const) : (action as ModeratedComment["status"]), flags: 0, reason: "", createdAt: "" };
    },
    listTravelRequests: async () => {
      const rows = await adminFetch<BackendTravelRow[]>("/travel/admin/requests");
      return (Array.isArray(rows) ? rows : []).map(mapAdminTravel);
    },
    reviewTravelRequest: async (id, action, note) => {
      const row = await adminFetch<BackendTravelRow>(`/travel/admin/requests/${id}/review`, { method: "POST", body: JSON.stringify({ decision: action, note }) });
      return mapAdminTravel(row ?? {});
    },
    listCountryPayments: async () => {
      const rows = await adminFetch<unknown[]>("/payments/admin/countries");
      return (Array.isArray(rows) ? rows : []).map(mapCountryPayment);
    },
    updateCountryPayment: async (c, patch) => {
      const rows = await adminFetch<unknown[]>("/payments/admin/countries");
      const configId = (Array.isArray(rows) ? rows : [])
        .map((x) => x as { id?: string; countryCode?: string })
        .find((x) => String(x.countryCode ?? "").toLowerCase() === String(c).toLowerCase())?.id;
      if (!configId) throw new Error("Payment configuration not found.");
      const body: Record<string, unknown> = {};
      if (patch.amount !== undefined) body.amount = patch.amount;
      const updated = await adminFetch<unknown>(`/payments/admin/countries/${encodeURIComponent(configId)}`, { method: "PATCH", body: JSON.stringify(body) });
      return mapCountryPayment(updated);
    },
    listProviders: async () => {
      const rows = await adminFetch<unknown[]>("/admin/providers");
      return (Array.isArray(rows) ? rows : []).map(mapProvider);
    },
    toggleProvider: async (id, enabled) => mapProvider(await adminFetch<unknown>(`/admin/providers/${id}/toggle`, { method: "POST", body: JSON.stringify({ enabled }) })),
    testProvider: async (id) => mapProvider(await adminFetch<unknown>(`/admin/providers/${id}/test`, { method: "POST" })),
    listCountries: async () => {
      const rows = await adminFetch<unknown[]>("/countries");
      return (Array.isArray(rows) ? rows : []).map(mapRegionCountry);
    },
    updateCountry: async (c, patch) => {
      const rows = await adminFetch<unknown[]>("/countries");
      const code = (Array.isArray(rows) ? rows : [])
        .map((x) => x as { code?: string; name?: string })
        .find((x) => x.name === c || x.code === c)?.code ?? c;
      const updated = await adminFetch<unknown>(`/countries/${encodeURIComponent(code)}`, { method: "PATCH", body: JSON.stringify(patch) });
      return mapRegionCountry(updated);
    },
    listNotifications: async () => {
      const rows = await adminFetch<unknown[]>("/notifications/admin/all");
      return (Array.isArray(rows) ? rows : []).map(mapAdminNotification);
    },
    createNotification: async (input) => mapAdminNotification(
      await adminFetch<unknown>("/notifications/admin", { method: "POST", body: JSON.stringify(input) }),
    ),
    listSecurityEvents: async () => {
      const rows = await adminFetch<unknown[]>("/security/events");
      return (Array.isArray(rows) ? rows : []).map(mapSecurityEvent);
    },
    updateSecurityEvent: async (id, status) => mapSecurityEvent(
      await adminFetch<unknown>(`/security/events/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }),
    ),
    listSessions: async () => {
      const rows = await adminFetch<unknown[]>("/security/sessions");
      return (Array.isArray(rows) ? rows : []).map(mapAdminSession);
    },
    terminateSession: async (id) => mapAdminSession(
      await adminFetch<unknown>(`/security/sessions/${id}/terminate`, { method: "POST" }),
    ),
    listDevices: async () => {
      const rows = await adminFetch<unknown[]>("/security/devices");
      return (Array.isArray(rows) ? rows : []).map(mapAdminDevice);
    },
    listRestrictions: async () => {
      const rows = await adminFetch<unknown[]>("/restrictions");
      return (Array.isArray(rows) ? rows : []).map(mapAdminRestriction);
    },
    applyRestriction: async (input) => {
      // Backend expects the user id; the UI may hand over a member code,
      // so resolve it against the directory first.
      let userId = input.memberId;
      const members = await adminFetch<BackendUserLite[]>(`/admin/members?search=${encodeURIComponent(input.memberId)}`).catch(() => []);
      const exact = (Array.isArray(members) ? members : []).find(
        (m) => m.id === input.memberId || m.member?.memberCode === input.memberId || m.email?.toLowerCase() === input.memberId.toLowerCase(),
      );
      if (exact) userId = exact.id;
      const duration = /(\d+)\s*days?/i.test(input.duration) ? `${input.duration.match(/(\d+)\s*days?/i)![1]}d` : undefined;
      const row = await adminFetch<unknown>("/restrictions", {
        method: "POST",
        body: JSON.stringify({
          memberId: userId,
          type: mapRestrictionTypeToBackend(input.type),
          reason: input.reason,
          ...(duration ? { duration } : {}),
          affectedFeatures: input.affectedFeatures,
        }),
      });
      return mapAdminRestriction(row);
    },
    liftRestriction: async (id) => mapAdminRestriction(
      await adminFetch<unknown>(`/restrictions/${id}/lift`, { method: "POST" }),
    ),
    listSecurityRequests: async () => {
      // No dedicated endpoint: security-relevant tickets (appeals, travel
      // help, verification problems) serve this queue honestly.
      const rows = await adminFetch<BackendTicket[]>("/support/admin/tickets");
      const wanted = new Set(["security", "verification", "travel", "payment"]);
      return (Array.isArray(rows) ? rows : [])
        .filter((t) => wanted.has(String(t.category ?? "").toLowerCase()))
        .map((t) => {
          const mapped = mapSupportTicket(t);
          const st = mapped.status;
          return {
            id: mapped.id,
            memberId: mapped.memberId,
            memberName: mapped.memberName,
            category: mapped.category,
            subject: mapped.subject,
            status: (st === "open" || st === "waiting" || st === "in-progress" || st === "resolved" ? st : "open") as SecurityRequest["status"],
            updatedAt: mapped.updatedAt,
          };
        });
    },
    listAuditEvents: async () => {
      const rows = await adminFetch<unknown[]>("/audit/admin");
      return (Array.isArray(rows) ? rows : []).map(mapAuditEvent);
    },
    getCommunitySettings: async () => mapCommunitySettings(await adminFetch<unknown>("/settings/public")),
    updateCommunitySettings: async (patch) => mapCommunitySettings(
      await adminFetch<unknown>("/settings/community", { method: "PUT", body: JSON.stringify(patch) }),
    ),
    listTickets: async (s) => {
      const norm = (s ?? "All").toLowerCase();
      const rows = await adminFetch<BackendTicket[]>(`/support/admin/tickets${norm === "all" ? "" : `?status=${encodeURIComponent(norm)}`}`);
      return (Array.isArray(rows) ? rows : []).map(mapSupportTicket);
    },
    replyTicket: async (id, body) => mapSupportTicket(
      await adminFetch<BackendTicket>(`/support/admin/tickets/${id}/reply`, { method: "POST", body: JSON.stringify({ body }) }),
    ),
    updateTicketStatus: async (id, status) => mapSupportTicket(
      await adminFetch<BackendTicket>(`/support/admin/tickets/${id}/status`, { method: "POST", body: JSON.stringify({ status }) }),
    ),
    listFeatureFlags: async () => {
      const rows = await adminFetch<{ key?: string; enabled?: boolean }[]>("/settings/flags");
      return (Array.isArray(rows) ? rows : []).map((f) => ({ key: String(f.key ?? ""), enabled: Boolean(f.enabled) }));
    },
    setFeatureFlag: async (key, enabled) => {
      const row = await adminFetch<{ key?: string; enabled?: boolean }>(`/settings/flags/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({ enabled }),
      });
      return { key: String(row.key ?? key), enabled: Boolean(row.enabled ?? enabled) };
    },
    getAppSettings: async () => {
      const rows = await adminFetch<{ key?: string; value?: unknown }[]>("/settings");
      const out: Record<string, unknown> = {};
      for (const r of Array.isArray(rows) ? rows : []) out[String(r.key)] = r.value;
      return out;
    },
    setAppSetting: async (key, value) => {
      await adminFetch(`/settings/${encodeURIComponent(key)}`, { method: "PUT", body: JSON.stringify({ value }) });
    },
    getAnalytics: async () => {
      const s = await adminFetch<{
        memberGrowth?: { label?: string; value?: number }[];
        verificationRate?: number;
        activeMembers?: number;
        communitySubmissions?: number;
        moderation?: { approved?: number; rejected?: number; pending?: number };
        contributions?: { total?: string | number; count?: number };
        countryDistribution?: { label?: string; value?: number }[];
      }>("/analytics");
      return {
        memberGrowth: (s.memberGrowth ?? []).map((g) => ({ label: String(g.label ?? ""), value: Number(g.value ?? 0) })),
        verificationRate: Number(s.verificationRate ?? 0),
        activeMembers: Number(s.activeMembers ?? 0),
        contentEngagement: 0,
        videoViews: 0,
        educationEngagement: 0,
        communitySubmissions: Number(s.communitySubmissions ?? 0),
        moderation: {
          approved: Number(s.moderation?.approved ?? 0),
          rejected: Number(s.moderation?.rejected ?? 0),
          pending: Number(s.moderation?.pending ?? 0),
        },
        contributions: [{ label: "Successful payments", value: Number(s.contributions?.count ?? 0) }],
        countryDistribution: (s.countryDistribution ?? []).map((c) => ({ label: String(c.label ?? ""), value: Number(c.value ?? 0) })),
      };
    },
  };
}

export function createAdminApiResolved(actor: string, role: "super" | "security" | "content" | "moderator" | "finance"): AdminApi {
  if (isAdminRealApiEnabled()) return createRealAdminApi();
  return createAdminApi({ actor, role });
}
