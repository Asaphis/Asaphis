export type PrototypeView = "public" | "join" | "member"

export type MemberPanel =
  | "home"
  | "education"
  | "videos"
  | "documents"
  | "updates"
  | "community"
  | "contribute"
  | "notifications"
  | "profile"
  | "security"
  | "travel"
  | "support"

export type Country =
  | "Nigeria"
  | "Ghana"
  | "Kenya"
  | "United Kingdom"
  | "United States"
  | "Other / support needed"

export type IdentityDocument =
  | "NIN"
  | "Passport"
  | "Driver's Licence"
  | "Ghana Card"
  | "National ID"
  | "Driving Licence"
  | "State ID"
  | "Support review"

export type PhoneChannel = "SMS" | "WhatsApp" | "Voice"
export type PaymentMethod = "Card" | "Transfer" | "Mobile money"
export type PaymentStatus =
  | "Pending"
  | "Processing"
  | "Successful"
  | "Failed"
  | "Cancelled"
export type ResourceCategory =
  | "History"
  | "Culture"
  | "Development"
  | "Education"
  | "Technology"
  | "Community knowledge"
export type ResourceKind = "Article" | "Video" | "Brief" | "Document"
export type SubmissionStatus =
  | "Draft"
  | "Under Review"
  | "Approved"
  | "Scheduled"
  | "Published"
  | "Rejected"
  | "Changes Requested"
export type NotificationCategory =
  | "Updates"
  | "Education"
  | "Community"
  | "Moderation"
  | "Security"
  | "Travel"
  | "Account"
  | "Support"
export type TravelStatus = "Pending" | "Approved" | "Rejected" | "Expired"
export type SupportCategory =
  | "Account"
  | "Verification"
  | "Travel"
  | "Security"
  | "Payment"
  | "Community"
  | "Other"
export type AsyncState = "idle" | "loading" | "success" | "error" | "empty"

export interface HeroContent {
  eyebrow: string
  title: string
  lede: string
  imageUrl: string
  imageAlt: string
  caption: string
  index: string
}

export interface FeaturedMessage {
  title: string
  description: string
  videoUrl: string
  posterUrl: string
  posterAlt: string
  transcriptAvailable: boolean
  publishedAt: string
  durationMinutes: number
}

export interface Resource {
  id: string
  category: ResourceCategory
  kind: ResourceKind
  title: string
  description: string
  imageUrl?: string
  imageAlt?: string
  durationMinutes?: number
  visibility: "public" | "member"
  publishedAt: string
}

export interface PublicContent {
  hero: HeroContent
  featuredMessage: FeaturedMessage
  about: {
    eyebrow: string
    title: string
    paragraphs: string[]
    imageUrl: string
    imageAlt: string
  }
  vision: {
    title: string
    intro: string
    current: { title: string; body: string; items: string[] }
    future: { title: string; body: string; items: string[] }
  }
  educationPreview: Resource[]
  support: {
    title: string
    body: string
    reasons: string[]
    amount: number
    currency: string
    methods: PaymentMethod[]
  }
  communityPreview: {
    title: string
    body: string
    imageUrl: string
    imageAlt: string
    links: { label: string; href: string }[]
  }
}

export interface CountryConfig {
  country: Country
  identityDocuments: IdentityDocument[]
  contribution: {
    currency: string
    amount: number
    methods: PaymentMethod[]
    usesGlobalFallback: boolean
  }
  phoneChannels: PhoneChannel[]
}

export interface OnboardingState {
  stepIndex: number
  account: { name: string; email: string; password: string }
  phone: {
    number: string
    otp: string
    channel: PhoneChannel
    resendSeconds: number
    verified: boolean
  }
  currentLocation: Country
  citizenshipOrEligibility: Country
  identityDocument: IdentityDocument
  identityStatus: "not_started" | "pending" | "verified" | "failed"
  securityChecked: boolean
  contribution: {
    amount: number
    currency: string
    method: PaymentMethod
    status: PaymentStatus
  }
  activated: boolean
}

export interface MemberProfile {
  name: string
  initials: string
  memberId: string
  country: Country
  joinedAt: string
  identityVerified: boolean
  phoneVerified: boolean
  accountStatus: "active" | "limited"
}

export interface DocumentRecord {
  id: string
  title: string
  description: string
  category: ResourceCategory
  publishedAt: string
  fileType: string
  authorization: "allowed" | "denied"
}

export interface SubmissionRecord {
  id: string
  title: string
  body: string
  status: SubmissionStatus
  adminMessage?: string
  updatedAt: string
}

export interface NotificationRecord {
  id: string
  category: NotificationCategory
  title: string
  body: string
  createdAt: string
  read: boolean
}

export interface TravelRequest {
  id: string
  destination: string
  startDate: string
  endDate: string
  reason: string
  additionalInformation?: string
  status: TravelStatus
  expiresAt?: string
}

export interface SupportResponse {
  author: string
  body: string
  createdAt: string
}

export interface SupportRequest {
  id: string
  category: SupportCategory
  subject: string
  message: string
  status: "open" | "pending" | "resolved"
  createdAt: string
  responses: SupportResponse[]
}

export interface DemoData {
  publicContent: PublicContent
  countryConfigs: Record<string, CountryConfig>
  member: MemberProfile
  resources: Resource[]
  documents: DocumentRecord[]
  submissions: SubmissionRecord[]
  notifications: NotificationRecord[]
  travelRequests: TravelRequest[]
  supportRequests: SupportRequest[]
}

export const memberPanelLabels: Record<MemberPanel, string> = {
  home: "Home",
  education: "Education",
  videos: "Videos",
  documents: "Documents",
  updates: "Updates",
  community: "Community",
  contribute: "Contribute",
  notifications: "Notifications",
  profile: "Profile",
  security: "Security",
  travel: "Travel access",
  support: "Support",
}

export const onboardingSteps = [
  "Account",
  "Phone",
  "Country & eligibility",
  "Identity",
  "Security check",
  "Contribution",
  "Activated",
] as const

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(
    new Date(value),
  )
}

export function formatContribution(
  amount: number,
  currency: string,
  locale = "en-NG",
) {
  return `${currency} ${amount.toLocaleString(locale)}`
}

export function formatMemberId(countryCode: string, sequence: string) {
  return `MEM-${countryCode}-${sequence}`
}
