import type {
  Country,
  CountryConfig,
  DocumentRecord,
  MemberProfile,
  NotificationCategory,
  NotificationRecord,
  PaymentMethod,
  PaymentStatus,
  Resource,
  SupportRequest,
  SubmissionRecord,
  TravelRequest,
} from "@/lib/types"

export interface ContentApi {
  getPublishedLandingContent(): Promise<import("@/lib/types").PublicContent>
}

export interface AuthApi {
  login(input: { email: string; password: string }): Promise<{
    token: string
    memberId: string
  }>
  logout(): Promise<{ success: boolean }>
}

export interface OnboardingApi {
  detectCurrentCountry(): Promise<{ country: Country; source: "ip" | "mock" }>
  sendPhoneCode(input: {
    number: string
    channel: import("@/lib/types").PhoneChannel
  }): Promise<{ challengeId: string; resendAfterSeconds: number }>
  verifyPhoneCode(input: {
    challengeId: string
    code: string
  }): Promise<{ verified: boolean }>
  getCountryConfig(country: Country): Promise<CountryConfig>
  submitIdentity(input: {
    country: Country
    document: import("@/lib/types").IdentityDocument
    fileToken: string
  }): Promise<{ status: "pending" | "verified" | "failed" }>
  runSecurityCheck(): Promise<{ passed: boolean }>
  createContribution(input: {
    amount: number
    currency: string
    method: PaymentMethod
  }): Promise<{ id: string; status: PaymentStatus }>
  getActivationStatus(): Promise<{ active: boolean; memberId?: string }>
}

export interface MemberApi {
  getMemberProfile(): Promise<MemberProfile>
  getEducation(query: {
    category?: string
    search?: string
  }): Promise<Resource[]>
  getVideos(): Promise<Resource[]>
  getDocuments(): Promise<DocumentRecord[]>
  requestDocumentDownload(id: string): Promise<{
    fileToken: string
    expiresAt: string
  }>
  getNotifications(category?: NotificationCategory): Promise<NotificationRecord[]>
  submitCommunityContribution(input: {
    title: string
    body: string
  }): Promise<SubmissionRecord>
  createTravelRequest(input: {
    destination: string
    startDate: string
    endDate: string
    reason: string
    additionalInformation?: string
  }): Promise<TravelRequest>
  createSupportRequest(input: {
    category: import("@/lib/types").SupportCategory
    subject: string
    message: string
  }): Promise<SupportRequest>
}

export type AsaPhisApi = ContentApi & AuthApi & OnboardingApi & MemberApi
