import type {
  AdminMember,
  AdminNotification,
  AdminRestriction,
  AdminSession,
  AdminDevice,
  AdminTravelRequest,
  AnalyticsSummary,
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
  SubmissionStatus,
  SupportTicket,
  VerificationStatus,
} from "@/lib/admin-types";

export interface AdminDashboardApi {
  getDashboardStats(): Promise<DashboardStats>;
}

export interface AdminMembersApi {
  listMembers(query?: {
    search?: string;
    country?: string;
    identityStatus?: string;
    accountStatus?: string;
    trustStatus?: string;
  }): Promise<AdminMember[]>;
  getMember(id: string): Promise<AdminMember>;
}

export interface AdminIdentityApi {
  listIdentityCases(status?: string): Promise<IdentityCase[]>;
  getIdentityCase(id: string): Promise<IdentityCase>;
  reviewIdentityCase(
    id: string,
    action: "approve" | "reject" | "request-info" | "manual-review",
    note?: string,
  ): Promise<IdentityCase>;
}

export interface AdminContentApi {
  listContent(): Promise<ContentItem[]>;
  updateContentStatus(id: string, status: ContentItem["status"]): Promise<ContentItem>;
  reorderContent(ids: string[]): Promise<ContentItem[]>;
  listLandingSections(): Promise<LandingSection[]>;
  updateLandingSection(
    id: string,
    patch: Partial<LandingSection>,
  ): Promise<LandingSection>;
  reorderLandingSections(ids: string[]): Promise<LandingSection[]>;
  listContentVersions(contentId: string): Promise<ContentVersion[]>;
  restoreContentVersion(contentId: string, version: number): Promise<ContentItem>;
}

export interface AdminModerationApi {
  listSubmissions(status?: string): Promise<Submission[]>;
  reviewSubmission(
    id: string,
    action: "approve" | "reject" | "request-changes" | "schedule" | "publish",
    note?: string,
  ): Promise<Submission>;
  listComments(filter?: string): Promise<ModeratedComment[]>;
  reviewComment(
    id: string,
    action: "approve" | "hide" | "delete" | "warn",
  ): Promise<ModeratedComment>;
}

export interface AdminTravelApi {
  listTravelRequests(): Promise<AdminTravelRequest[]>;
  reviewTravelRequest(
    id: string,
    action: "approve" | "reject" | "revoke" | "request-verification",
    note?: string,
  ): Promise<AdminTravelRequest>;
}

export interface AdminPaymentsApi {
  listCountryPayments(): Promise<CountryPaymentConfig[]>;
  updateCountryPayment(
    country: string,
    patch: Partial<CountryPaymentConfig>,
  ): Promise<CountryPaymentConfig>;
  listProviders(): Promise<PaymentProvider[]>;
  toggleProvider(id: string, enabled: boolean): Promise<PaymentProvider>;
  testProvider(id: string): Promise<PaymentProvider>;
}

export interface AdminRegionsApi {
  listCountries(): Promise<RegionCountry[]>;
  updateCountry(
    country: string,
    patch: Partial<RegionCountry>,
  ): Promise<RegionCountry>;
}

export interface AdminNotificationsApi {
  listNotifications(): Promise<AdminNotification[]>;
  createNotification(input: {
    title: string;
    body: string;
    audience: string;
    channel: string;
    scheduledFor?: string;
  }): Promise<AdminNotification>;
}

export interface AdminSecurityApi {
  listSecurityEvents(): Promise<SecurityEvent[]>;
  updateSecurityEvent(id: string, status: SecurityEvent["status"]): Promise<SecurityEvent>;
  listSessions(): Promise<AdminSession[]>;
  terminateSession(id: string): Promise<AdminSession>;
  listDevices(): Promise<AdminDevice[]>;
  listRestrictions(): Promise<AdminRestriction[]>;
  applyRestriction(input: {
    memberId: string;
    type: RestrictionType;
    reason: string;
    duration: string;
    affectedFeatures: string[];
  }): Promise<AdminRestriction>;
  liftRestriction(id: string): Promise<AdminRestriction>;
  listSecurityRequests(): Promise<SecurityRequest[]>;
  listAuditEvents(): Promise<AuditEvent[]>;
}

export interface AdminCommunityApi {
  getCommunitySettings(): Promise<{
    whatsapp: string;
    telegram: string;
    description: string;
    postingRules: string;
    commentRules: string;
    submissionRequirements: string;
    moderationPolicy: string;
  }>;
  updateCommunitySettings(
    patch: Partial<{
      whatsapp: string;
      telegram: string;
      description: string;
      postingRules: string;
      commentRules: string;
      submissionRequirements: string;
      moderationPolicy: string;
    }>,
  ): Promise<{
    whatsapp: string;
    telegram: string;
    description: string;
    postingRules: string;
    commentRules: string;
    submissionRequirements: string;
    moderationPolicy: string;
  }>;
}

export interface AdminSupportApi {
  listTickets(status?: string): Promise<SupportTicket[]>;
  replyTicket(id: string, body: string): Promise<SupportTicket>;
  updateTicketStatus(
    id: string,
    status: SupportTicket["status"],
  ): Promise<SupportTicket>;
}

export interface AdminAnalyticsApi {
  getAnalytics(): Promise<AnalyticsSummary>;
}

export type AdminApi = AdminDashboardApi &
  AdminMembersApi &
  AdminIdentityApi &
  AdminContentApi &
  AdminModerationApi &
  AdminTravelApi &
  AdminPaymentsApi &
  AdminRegionsApi &
  AdminNotificationsApi &
  AdminSecurityApi &
  AdminCommunityApi &
  AdminSupportApi &
  AdminAnalyticsApi;

export type { SubmissionStatus, VerificationStatus };
