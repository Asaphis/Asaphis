export type AdminRole =
  | "super"
  | "security"
  | "content"
  | "moderator"
  | "finance";

export const adminRoleLabels: Record<AdminRole, string> = {
  super: "Super Admin",
  security: "Security Admin",
  content: "Content Admin",
  moderator: "Moderator",
  finance: "Finance Admin",
};

export type VerificationStatus =
  | "pending"
  | "processing"
  | "verified"
  | "rejected"
  | "needs-review"
  | "failed";

export type AccountStatus = "active" | "limited" | "suspended" | "banned";

export type TrustStatus = "trusted" | "standard" | "watch" | "restricted";

export type RestrictionType =
  | "limited"
  | "verification-required"
  | "comment-restricted"
  | "submission-restricted"
  | "upload-restricted"
  | "payment-restricted"
  | "security-hold"
  | "suspended"
  | "banned";

export const restrictionLabels: Record<RestrictionType, string> = {
  limited: "Limited",
  "verification-required": "Verification Required",
  "comment-restricted": "Comment Restricted",
  "submission-restricted": "Submission Restricted",
  "upload-restricted": "Upload Restricted",
  "payment-restricted": "Payment Restricted",
  "security-hold": "Security Hold",
  suspended: "Suspended",
  banned: "Banned",
};

export interface AdminMember {
  id: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  country: string;
  memberSince: string;
  identityStatus: VerificationStatus;
  phoneVerified: boolean;
  accountStatus: AccountStatus;
  trustStatus: TrustStatus;
  currentCountry: string;
  travelStatus: "clear" | "pending" | "approved" | "expired";
}

export interface IdentityCase {
  id: string;
  memberId: string;
  memberName: string;
  country: string;
  documentType: string;
  provider: string;
  status: VerificationStatus;
  result: string;
  submittedAt: string;
  reviewedAt?: string;
  riskIndicators: string[];
  reviewHistory: { by: string; action: string; at: string; note?: string }[];
}

export type ContentStatus =
  | "draft"
  | "published"
  | "hidden"
  | "scheduled"
  | "archived";

export interface ContentItem {
  id: string;
  section: string;
  title: string;
  kind: string;
  status: ContentStatus;
  updatedAt: string;
  updatedBy: string;
  scheduledFor?: string;
  sortOrder: number;
}

export interface ContentVersion {
  id: string;
  contentId: string;
  version: number;
  changedBy: string;
  changedAt: string;
  summary: string;
}

export interface LandingSection {
  id: string;
  key: string;
  title: string;
  visible: boolean;
  sortOrder: number;
  updatedAt: string;
}

export type SubmissionStatus =
  | "pending"
  | "under-review"
  | "changes-requested"
  | "approved"
  | "rejected"
  | "scheduled"
  | "published";

export const submissionStatusLabels: Record<SubmissionStatus, string> = {
  pending: "Pending",
  "under-review": "Under Review",
  "changes-requested": "Changes Requested",
  approved: "Approved",
  rejected: "Rejected",
  scheduled: "Scheduled",
  published: "Published",
};

export interface Submission {
  id: string;
  title: string;
  body: string;
  author: string;
  memberId: string;
  country: string;
  status: SubmissionStatus;
  submittedAt: string;
  trustStatus: TrustStatus;
  riskIndicators: string[];
  reviewerNote?: string;
}

export interface ModeratedComment {
  id: string;
  body: string;
  author: string;
  memberId: string;
  status: "approved" | "pending" | "flagged" | "hidden";
  flags: number;
  reason: string;
  createdAt: string;
}

export type TravelRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "revoked";

export interface AdminTravelRequest {
  id: string;
  memberId: string;
  memberName: string;
  verifiedCountry: string;
  currentIpCountry: string;
  destination: string;
  startDate: string;
  endDate: string;
  device: string;
  risk: "low" | "medium" | "high";
  vpnDetected: boolean;
  reason: string;
  status: TravelRequestStatus;
  expiresAt?: string;
}

export interface PaymentProvider {
  id: string;
  name: string;
  countries: string[];
  methods: string[];
  priority: number;
  enabled: boolean;
  secretConfigured: boolean;
  lastTestedAt?: string;
  lastTestResult?: "ok" | "failed";
}

export interface CountryPaymentConfig {
  country: string;
  currency: string;
  amount: number;
  methods: string[];
  providers: string[];
  enabled: boolean;
}

export interface RegionCountry {
  country: string;
  enabled: boolean;
  documents: string[];
  provider: string;
  phoneRequired: boolean;
  livenessRequired: boolean;
  manualReview: boolean;
  eligibility: string;
  travelRule: string;
  accessRule: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  body: string;
  audience: string;
  channel: string;
  status: "draft" | "scheduled" | "sent";
  scheduledFor?: string;
  sentAt?: string;
  createdBy: string;
}

export interface SecurityEvent {
  id: string;
  memberId: string;
  memberName: string;
  type: string;
  risk: "low" | "medium" | "high";
  signals: string[];
  previousLocation: string;
  currentLocation: string;
  travelApproved: boolean;
  status: "open" | "reviewing" | "resolved";
  detectedAt: string;
}

export interface AdminSession {
  id: string;
  memberId: string;
  memberName: string;
  device: string;
  browser: string;
  os: string;
  ip: string;
  country: string;
  vpnDetected: boolean;
  risk: "low" | "medium" | "high";
  status: "active" | "suspicious" | "terminated";
  startedAt: string;
}

export interface AdminDevice {
  id: string;
  memberId: string;
  memberName: string;
  label: string;
  trusted: boolean;
  firstSeen: string;
  lastSeen: string;
}

export interface AdminRestriction {
  id: string;
  memberId: string;
  memberName: string;
  type: RestrictionType;
  reason: string;
  duration: string;
  affectedFeatures: string[];
  appliedBy: string;
  appliedAt: string;
  expiresAt?: string;
  active: boolean;
}

export interface SecurityRequest {
  id: string;
  memberId: string;
  memberName: string;
  category: string;
  subject: string;
  status: "open" | "waiting" | "in-progress" | "resolved";
  updatedAt: string;
}

export interface SupportTicket {
  id: string;
  memberId: string;
  memberName: string;
  category: string;
  priority: "low" | "normal" | "high" | "urgent";
  subject: string;
  status: "open" | "waiting" | "in-progress" | "resolved" | "closed";
  messages: { author: string; body: string; at: string }[];
  updatedAt: string;
}

export interface AuditEvent {
  id: string;
  actor: string;
  role: AdminRole;
  action: string;
  target: string;
  at: string;
}

export interface DashboardStats {
  totalMembers: number;
  verifiedMembers: number;
  activeMembers: number;
  pendingIdentity: number;
  pendingSubmissions: number;
  pendingTravel: number;
  contributionsTotal: string;
  suspiciousSessions: number;
  restrictedAccounts: number;
  recentAlerts: { id: string; title: string; at: string; risk: string }[];
  recentActivity: { id: string; actor: string; action: string; at: string }[];
}

export interface AnalyticsSummary {
  memberGrowth: { label: string; value: number }[];
  verificationRate: number;
  activeMembers: number;
  contentEngagement: number;
  videoViews: number;
  educationEngagement: number;
  communitySubmissions: number;
  moderation: { approved: number; rejected: number; pending: number };
  contributions: { label: string; value: number }[];
  countryDistribution: { label: string; value: number }[];
}

export function formatAdminDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    new Date(value),
  );
}
