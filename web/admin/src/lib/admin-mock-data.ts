import type {
  AdminDevice,
  AdminMember,
  AdminNotification,
  AdminRestriction,
  AdminSession,
  AdminTravelRequest,
  AuditEvent,
  ContentItem,
  ContentVersion,
  CountryPaymentConfig,
  IdentityCase,
  LandingSection,
  ModeratedComment,
  PaymentProvider,
  RegionCountry,
  SecurityEvent,
  SecurityRequest,
  Submission,
  SupportTicket,
} from "@/lib/admin-types";

export const adminMembers: AdminMember[] = [
  { id: "ASPH-10482", name: "Amara Okafor", initials: "AO", email: "amara.okafor@example.com", phone: "+234 801 234 5678", country: "Nigeria", memberSince: "2026-09-08", identityStatus: "verified", phoneVerified: true, accountStatus: "active", trustStatus: "trusted", currentCountry: "Nigeria", travelStatus: "clear" },
  { id: "ASPH-10481", name: "Kwame Mensah", initials: "KM", email: "kwame.mensah@example.com", phone: "+233 201 345 678", country: "Ghana", memberSince: "2026-09-06", identityStatus: "verified", phoneVerified: true, accountStatus: "active", trustStatus: "standard", currentCountry: "Ghana", travelStatus: "clear" },
  { id: "ASPH-10477", name: "Wanjiku Njeri", initials: "WN", email: "w.njeri@example.com", phone: "+254 722 456 789", country: "Kenya", memberSince: "2026-09-02", identityStatus: "needs-review", phoneVerified: true, accountStatus: "limited", trustStatus: "watch", currentCountry: "Kenya", travelStatus: "pending" },
  { id: "ASPH-10471", name: "Fatima Bello", initials: "FB", email: "fatima.bello@example.com", phone: "+234 803 987 1234", country: "Nigeria", memberSince: "2026-08-28", identityStatus: "pending", phoneVerified: false, accountStatus: "active", trustStatus: "standard", currentCountry: "Nigeria", travelStatus: "clear" },
  { id: "ASPH-10466", name: "Daniel Carter", initials: "DC", email: "d.carter@example.com", phone: "+44 7700 900123", country: "United Kingdom", memberSince: "2026-08-21", identityStatus: "verified", phoneVerified: true, accountStatus: "active", trustStatus: "trusted", currentCountry: "France", travelStatus: "pending" },
  { id: "ASPH-10459", name: "Aisha Diallo", initials: "AD", email: "aisha.diallo@example.com", phone: "+234 805 112 8899", country: "Nigeria", memberSince: "2026-08-15", identityStatus: "rejected", phoneVerified: true, accountStatus: "limited", trustStatus: "restricted", currentCountry: "Nigeria", travelStatus: "clear" },
  { id: "ASPH-10452", name: "Brian Osei", initials: "BO", email: "b.osei@example.com", phone: "+233 244 556 789", country: "Ghana", memberSince: "2026-08-09", identityStatus: "processing", phoneVerified: true, accountStatus: "active", trustStatus: "standard", currentCountry: "Ghana", travelStatus: "clear" },
  { id: "ASPH-10447", name: "Grace Adeyemi", initials: "GA", email: "grace.adeyemi@example.com", phone: "+234 809 334 2211", country: "Nigeria", memberSince: "2026-08-02", identityStatus: "verified", phoneVerified: true, accountStatus: "active", trustStatus: "standard", currentCountry: "United Kingdom", travelStatus: "approved" },
];

export const identityCases: IdentityCase[] = [
  { id: "ID-3011", memberId: "ASPH-10471", memberName: "Fatima Bello", country: "Nigeria", documentType: "NIN", provider: "Provider A", status: "pending", result: "Awaiting provider response", submittedAt: "2026-09-08", riskIndicators: ["New device"], reviewHistory: [{ by: "System", action: "Submitted", at: "2026-09-08" }] },
  { id: "ID-3009", memberId: "ASPH-10477", memberName: "Wanjiku Njeri", country: "Kenya", documentType: "National ID", provider: "Provider B", status: "needs-review", result: "Photo quality below threshold", submittedAt: "2026-09-06", riskIndicators: ["Low image quality", "Name variation"], reviewHistory: [{ by: "System", action: "Flagged for review", at: "2026-09-06" }, { by: "R. Haddad", action: "Requested clearer photo", at: "2026-09-07", note: "Ask for a daylight capture" }] },
  { id: "ID-3006", memberId: "ASPH-10452", memberName: "Brian Osei", country: "Ghana", documentType: "Ghana Card", provider: "Provider A", status: "processing", result: "Provider verification in progress", submittedAt: "2026-09-05", riskIndicators: [], reviewHistory: [{ by: "System", action: "Sent to provider", at: "2026-09-05" }] },
  { id: "ID-3002", memberId: "ASPH-10459", memberName: "Aisha Diallo", country: "Nigeria", documentType: "Driver's Licence", provider: "Provider A", status: "rejected", result: "Document expired", submittedAt: "2026-09-01", reviewedAt: "2026-09-02", riskIndicators: ["Expired document"], reviewHistory: [{ by: "System", action: "Submitted", at: "2026-09-01" }, { by: "S. Bakare", action: "Rejected", at: "2026-09-02", note: "Licence expired March 2026" }] },
  { id: "ID-2998", memberId: "ASPH-10482", memberName: "Amara Okafor", country: "Nigeria", documentType: "NIN", provider: "Provider A", status: "verified", result: "Match score 0.97", submittedAt: "2026-08-30", reviewedAt: "2026-08-30", riskIndicators: [], reviewHistory: [{ by: "System", action: "Verified", at: "2026-08-30" }] },
];

export const contentItems: ContentItem[] = [
  { id: "ct-hero", section: "Hero", title: "A serious home for African education and shared progress.", kind: "Hero", status: "published", updatedAt: "2026-09-04", updatedBy: "C. Eze", sortOrder: 1 },
  { id: "ct-message", section: "Featured message", title: "Knowledge is a shared responsibility.", kind: "Video", status: "published", updatedAt: "2026-09-04", updatedBy: "C. Eze", sortOrder: 2 },
  { id: "ct-about", section: "About", title: "A long-term home for learning and participation.", kind: "Article", status: "published", updatedAt: "2026-09-01", updatedBy: "L. Mensimah", sortOrder: 3 },
  { id: "ct-vision", section: "Vision", title: "Build the foundation before the horizon.", kind: "Article", status: "published", updatedAt: "2026-08-29", updatedBy: "L. Mensimah", sortOrder: 4 },
  { id: "ct-edu-1", section: "Education", title: "How to keep context when a story travels", kind: "Article", status: "published", updatedAt: "2026-09-03", updatedBy: "C. Eze", sortOrder: 5 },
  { id: "ct-edu-2", section: "Education", title: "A community note is more than a post", kind: "Brief", status: "published", updatedAt: "2026-08-22", updatedBy: "C. Eze", sortOrder: 6 },
  { id: "ct-edu-3", section: "Education", title: "Designing technology for people who need it", kind: "Video", status: "scheduled", updatedAt: "2026-08-20", updatedBy: "C. Eze", scheduledFor: "2026-09-15", sortOrder: 7 },
  { id: "ct-update-sep", section: "Updates", title: "What we are learning from the first member cohort", kind: "Journal", status: "draft", updatedAt: "2026-09-07", updatedBy: "L. Mensimah", sortOrder: 8 },
  { id: "ct-community", section: "Community", title: "Community, with care.", kind: "Info", status: "published", updatedAt: "2026-08-25", updatedBy: "C. Eze", sortOrder: 9 },
  { id: "ct-cta", section: "Final CTA", title: "Learn something useful. Add something careful.", kind: "CTA", status: "published", updatedAt: "2026-08-25", updatedBy: "C. Eze", sortOrder: 10 },
  { id: "ct-archive", section: "Education", title: "Early orientation draft (archived)", kind: "Article", status: "archived", updatedAt: "2026-07-30", updatedBy: "C. Eze", sortOrder: 11 },
];

export const landingSections: LandingSection[] = [
  { id: "ls-hero", key: "hero", title: "Hero", visible: true, sortOrder: 1, updatedAt: "2026-09-04" },
  { id: "ls-message", key: "message", title: "Message / video", visible: true, sortOrder: 2, updatedAt: "2026-09-04" },
  { id: "ls-about", key: "about", title: "About", visible: true, sortOrder: 3, updatedAt: "2026-09-01" },
  { id: "ls-vision", key: "vision", title: "Vision", visible: true, sortOrder: 4, updatedAt: "2026-08-29" },
  { id: "ls-why", key: "why", title: "Why AsaPhis", visible: true, sortOrder: 5, updatedAt: "2026-08-29" },
  { id: "ls-education", key: "education", title: "Education", visible: true, sortOrder: 6, updatedAt: "2026-09-03" },
  { id: "ls-community", key: "community", title: "Community", visible: true, sortOrder: 7, updatedAt: "2026-08-25" },
  { id: "ls-support", key: "support", title: "Support / Contribution", visible: true, sortOrder: 8, updatedAt: "2026-08-25" },
  { id: "ls-cta", key: "final-cta", title: "Final CTA", visible: true, sortOrder: 9, updatedAt: "2026-08-25" },
];

export const contentVersions: ContentVersion[] = [
  { id: "cv-7", contentId: "ct-hero", version: 7, changedBy: "C. Eze", changedAt: "2026-09-04", summary: "Tightened headline, updated hero image" },
  { id: "cv-6", contentId: "ct-hero", version: 6, changedBy: "L. Mensimah", changedAt: "2026-08-28", summary: "Reworked lede paragraph" },
  { id: "cv-5", contentId: "ct-hero", version: 5, changedBy: "C. Eze", changedAt: "2026-08-20", summary: "First published version" },
  { id: "cv-3", contentId: "ct-message", version: 3, changedBy: "C. Eze", changedAt: "2026-09-04", summary: "Updated transcript excerpt" },
  { id: "cv-2", contentId: "ct-message", version: 2, changedBy: "C. Eze", changedAt: "2026-08-27", summary: "Corrected duration metadata" },
];

export const submissions: Submission[] = [
  { id: "SUB-2201", title: "A note on neighborhood learning circles", body: "How informal study groups share resources and keep learning visible.", author: "Amara Okafor", memberId: "ASPH-10482", country: "Nigeria", status: "changes-requested", submittedAt: "2026-09-08", trustStatus: "trusted", riskIndicators: [], reviewerNote: "Please add a source or first-person context." },
  { id: "SUB-2198", title: "Market-day apprenticeship notes", body: "Observations on how traders teach measurement and negotiation.", author: "Kwame Mensah", memberId: "ASPH-10481", country: "Ghana", status: "pending", submittedAt: "2026-09-07", trustStatus: "standard", riskIndicators: [] },
  { id: "SUB-2195", title: "What our reading room preserved", body: "A short history of a community library in Kisumu.", author: "Wanjiku Njeri", memberId: "ASPH-10477", country: "Kenya", status: "under-review", submittedAt: "2026-09-06", trustStatus: "watch", riskIndicators: ["Author under watch"] },
  { id: "SUB-2191", title: "Proverbs about collective work", body: "Five sayings and the occasions they guide.", author: "Grace Adeyemi", memberId: "ASPH-10447", country: "Nigeria", status: "approved", submittedAt: "2026-09-04", trustStatus: "standard", riskIndicators: [] },
  { id: "SUB-2188", title: "Unverified grant announcement", body: "Claims about a funding window with no source.", author: "Aisha Diallo", memberId: "ASPH-10459", country: "Nigeria", status: "rejected", submittedAt: "2026-09-02", trustStatus: "restricted", riskIndicators: ["Restricted author", "No source"], reviewerNote: "No verifiable source provided." },
  { id: "SUB-2184", title: "Repair culture in the motor park", body: "How mechanics pass on diagnostic knowledge.", author: "Brian Osei", memberId: "ASPH-10452", country: "Ghana", status: "scheduled", submittedAt: "2026-08-30", trustStatus: "standard", riskIndicators: [] },
  { id: "SUB-2180", title: "Songs that carry instructions", body: "Work songs and what they teach newcomers.", author: "Amara Okafor", memberId: "ASPH-10482", country: "Nigeria", status: "published", submittedAt: "2026-08-27", trustStatus: "trusted", riskIndicators: [] },
];

export const moderatedComments: ModeratedComment[] = [
  { id: "CM-901", body: "This matches what our cooperative recorded last season.", author: "Kwame Mensah", memberId: "ASPH-10481", status: "approved", flags: 0, reason: "—", createdAt: "2026-09-07" },
  { id: "CM-902", body: "DM me for quick loans, no verification needed!!!", author: "Aisha Diallo", memberId: "ASPH-10459", status: "flagged", flags: 4, reason: "Spam / scam", createdAt: "2026-09-07" },
  { id: "CM-903", body: "I would like to see more context around who collected these notes.", author: "Amara Okafor", memberId: "ASPH-10482", status: "approved", flags: 0, reason: "—", createdAt: "2026-09-06" },
  { id: "CM-904", body: "You people know nothing, this whole archive is fake.", author: "Guest-441", memberId: "ASPH-10459", status: "pending", flags: 2, reason: "Abusive language", createdAt: "2026-09-06" },
];

export const travelRequests: AdminTravelRequest[] = [
  { id: "TRV-3302", memberId: "ASPH-10466", memberName: "Daniel Carter", verifiedCountry: "United Kingdom", currentIpCountry: "France", destination: "France", startDate: "2026-10-01", endDate: "2026-10-21", device: "MacBook Pro · Chrome", risk: "high", vpnDetected: true, reason: "Research visit and partner workshop.", status: "pending", expiresAt: "2026-10-21" },
  { id: "TRV-3301", memberId: "ASPH-10477", memberName: "Wanjiku Njeri", verifiedCountry: "Kenya", currentIpCountry: "Kenya", destination: "Ghana", startDate: "2026-10-05", endDate: "2026-10-19", device: "Tecno Spark · Chrome", risk: "medium", vpnDetected: false, reason: "Partner workshop in Accra.", status: "pending" },
  { id: "TRV-3298", memberId: "ASPH-10447", memberName: "Grace Adeyemi", verifiedCountry: "Nigeria", currentIpCountry: "United Kingdom", destination: "United Kingdom", startDate: "2026-09-10", endDate: "2026-09-30", device: "iPhone · Safari", risk: "low", vpnDetected: false, reason: "Family visit.", status: "approved", expiresAt: "2026-09-30" },
];

export const paymentProviders: PaymentProvider[] = [
  { id: "pp-paystack", name: "Paystack", countries: ["Nigeria", "Ghana"], methods: ["Card", "Transfer"], priority: 1, enabled: true, secretConfigured: true, lastTestedAt: "2026-09-07", lastTestResult: "ok" },
  { id: "pp-flutterwave", name: "Flutterwave", countries: ["Nigeria", "Kenya", "Ghana"], methods: ["Card", "Transfer", "Mobile money"], priority: 2, enabled: true, secretConfigured: true, lastTestedAt: "2026-09-06", lastTestResult: "ok" },
  { id: "pp-stripe", name: "Stripe", countries: ["United Kingdom", "United States"], methods: ["Card"], priority: 1, enabled: true, secretConfigured: true, lastTestedAt: "2026-09-05", lastTestResult: "ok" },
  { id: "pp-dpo", name: "DPO Pay", countries: ["Kenya"], methods: ["Card", "Mobile money"], priority: 3, enabled: false, secretConfigured: false },
];

export const countryPayments: CountryPaymentConfig[] = [
  { country: "Nigeria", currency: "NGN", amount: 25000, methods: ["Card", "Transfer", "Mobile money"], providers: ["Paystack", "Flutterwave"], enabled: true },
  { country: "Ghana", currency: "GHS", amount: 350, methods: ["Card", "Transfer", "Mobile money"], providers: ["Paystack", "Flutterwave"], enabled: true },
  { country: "Kenya", currency: "KES", amount: 3200, methods: ["Card", "Transfer", "Mobile money"], providers: ["Flutterwave"], enabled: true },
  { country: "United Kingdom", currency: "GBP", amount: 20, methods: ["Card", "Transfer"], providers: ["Stripe"], enabled: true },
  { country: "United States", currency: "USD", amount: 25, methods: ["Card", "Transfer"], providers: ["Stripe"], enabled: true },
  { country: "Other / support needed", currency: "USD", amount: 25, methods: ["Card", "Transfer"], providers: ["Stripe"], enabled: true },
];

export const regionCountries: RegionCountry[] = [
  { country: "Nigeria", enabled: true, documents: ["NIN", "Passport", "Driver's Licence"], provider: "Provider A", phoneRequired: true, livenessRequired: true, manualReview: true, eligibility: "Citizens and legal residents", travelRule: "Approval required outside Nigeria", accessRule: "Full access when verified" },
  { country: "Ghana", enabled: true, documents: ["Ghana Card", "Passport", "Driving Licence"], provider: "Provider A", phoneRequired: true, livenessRequired: false, manualReview: true, eligibility: "Citizens and legal residents", travelRule: "Approval required outside Ghana", accessRule: "Full access when verified" },
  { country: "Kenya", enabled: true, documents: ["National ID", "Passport", "Driving Licence"], provider: "Provider B", phoneRequired: true, livenessRequired: true, manualReview: true, eligibility: "Citizens and legal residents", travelRule: "Approval required outside Kenya", accessRule: "Full access when verified" },
  { country: "United Kingdom", enabled: true, documents: ["Passport", "Driving Licence"], provider: "Provider B", phoneRequired: false, livenessRequired: false, manualReview: false, eligibility: "Diaspora members", travelRule: "Notify on region change", accessRule: "Full access when verified" },
  { country: "United States", enabled: true, documents: ["Passport", "State ID", "Driving Licence"], provider: "Provider B", phoneRequired: false, livenessRequired: false, manualReview: false, eligibility: "Diaspora members", travelRule: "Notify on region change", accessRule: "Full access when verified" },
  { country: "South Africa", enabled: false, documents: ["National ID", "Passport"], provider: "Provider B", phoneRequired: true, livenessRequired: true, manualReview: true, eligibility: "Planned — pending provider coverage", travelRule: "Approval required", accessRule: "Limited until launch" },
];

export const adminNotifications: AdminNotification[] = [
  { id: "NT-501", title: "September journal is live", body: "Notes on the education library and moderation practice.", audience: "All members", channel: "In-app", status: "sent", sentAt: "2026-09-08", createdBy: "C. Eze" },
  { id: "NT-502", title: "New video: Material memory", body: "A conversation about materials, patterns, and place.", audience: "All members", channel: "Push", status: "sent", sentAt: "2026-09-07", createdBy: "C. Eze" },
  { id: "NT-503", title: "Planned maintenance window", body: "Brief downtime Sunday 02:00–03:00 WAT.", audience: "All members", channel: "In-app", status: "scheduled", scheduledFor: "2026-09-14", createdBy: "R. Haddad" },
  { id: "NT-504", title: "Travel policy reminder", body: "Request access before travelling outside your region.", audience: "Nigeria", channel: "In-app", status: "draft", createdBy: "S. Bakare" },
];

export const securityEvents: SecurityEvent[] = [
  { id: "RSK-701", memberId: "ASPH-10466", memberName: "Daniel Carter", type: "Impossible travel + VPN", risk: "high", signals: ["New device", "New country", "VPN detected"], previousLocation: "United Kingdom", currentLocation: "France", travelApproved: false, status: "open", detectedAt: "2026-09-08" },
  { id: "RSK-702", memberId: "ASPH-10477", memberName: "Wanjiku Njeri", type: "New device login", risk: "medium", signals: ["New device", "Night-time login"], previousLocation: "Kenya", currentLocation: "Kenya", travelApproved: true, status: "reviewing", detectedAt: "2026-09-07" },
  { id: "RSK-703", memberId: "ASPH-10459", memberName: "Aisha Diallo", type: "Repeated failed logins", risk: "medium", signals: ["5 failed attempts", "Password reset requested"], previousLocation: "Nigeria", currentLocation: "Nigeria", travelApproved: true, status: "open", detectedAt: "2026-09-06" },
];

export const adminSessions: AdminSession[] = [
  { id: "SES-11", memberId: "ASPH-10482", memberName: "Amara Okafor", device: "MacBook Pro", browser: "Chrome", os: "macOS", ip: "197.210.29.4", country: "Nigeria", vpnDetected: false, risk: "low", status: "active", startedAt: "2026-09-08" },
  { id: "SES-12", memberId: "ASPH-10482", memberName: "Amara Okafor", device: "iPhone 13", browser: "Safari", os: "iOS", ip: "197.210.30.11", country: "Nigeria", vpnDetected: false, risk: "low", status: "active", startedAt: "2026-09-06" },
  { id: "SES-13", memberId: "ASPH-10466", memberName: "Daniel Carter", device: "Unknown Linux host", browser: "Firefox", os: "Linux", ip: "82.64.10.200", country: "France", vpnDetected: true, risk: "high", status: "suspicious", startedAt: "2026-09-08" },
  { id: "SES-14", memberId: "ASPH-10477", memberName: "Wanjiku Njeri", device: "Tecno Spark 10", browser: "Chrome", os: "Android", ip: "196.201.214.8", country: "Kenya", vpnDetected: false, risk: "medium", status: "suspicious", startedAt: "2026-09-07" },
];

export const adminDevices: AdminDevice[] = [
  { id: "DEV-21", memberId: "ASPH-10482", memberName: "Amara Okafor", label: "MacBook Pro · Chrome", trusted: true, firstSeen: "2026-08-30", lastSeen: "2026-09-08" },
  { id: "DEV-22", memberId: "ASPH-10482", memberName: "Amara Okafor", label: "iPhone 13 · Safari", trusted: true, firstSeen: "2026-09-01", lastSeen: "2026-09-06" },
  { id: "DEV-23", memberId: "ASPH-10466", memberName: "Daniel Carter", label: "Unknown Linux host · Firefox", trusted: false, firstSeen: "2026-09-08", lastSeen: "2026-09-08" },
  { id: "DEV-24", memberId: "ASPH-10477", memberName: "Wanjiku Njeri", label: "Tecno Spark 10 · Chrome", trusted: false, firstSeen: "2026-09-07", lastSeen: "2026-09-07" },
];

export const adminRestrictions: AdminRestriction[] = [
  { id: "RST-41", memberId: "ASPH-10459", memberName: "Aisha Diallo", type: "submission-restricted", reason: "Repeated unsourced submissions", duration: "14 days", affectedFeatures: ["Community submissions", "Comments"], appliedBy: "S. Bakare", appliedAt: "2026-09-03", expiresAt: "2026-09-17", active: true },
  { id: "RST-42", memberId: "ASPH-10477", memberName: "Wanjiku Njeri", type: "verification-required", reason: "Identity photo needs re-capture", duration: "Until verified", affectedFeatures: ["New submissions", "Travel requests"], appliedBy: "R. Haddad", appliedAt: "2026-09-07", active: true },
];

export const securityRequests: SecurityRequest[] = [
  { id: "SEC-601", memberId: "ASPH-10471", memberName: "Fatima Bello", category: "Verification problem", subject: "NIN photo keeps failing", status: "open", updatedAt: "2026-09-08" },
  { id: "SEC-602", memberId: "ASPH-10466", memberName: "Daniel Carter", category: "Travel request", subject: "Workshop in Lyon next week", status: "waiting", updatedAt: "2026-09-08" },
  { id: "SEC-603", memberId: "ASPH-10459", memberName: "Aisha Diallo", category: "Restriction appeal", subject: "Appeal against submission restriction", status: "in-progress", updatedAt: "2026-09-06" },
];

export const supportTickets: SupportTicket[] = [
  { id: "SUP-260918", memberId: "ASPH-10482", memberName: "Amara Okafor", category: "Security", priority: "normal", subject: "Trusted device question", status: "waiting", messages: [{ author: "Amara Okafor", body: "I need help understanding my current sessions.", at: "2026-09-08" }, { author: "Member Care", body: "We have your request and will respond here within two days.", at: "2026-09-08" }], updatedAt: "2026-09-08" },
  { id: "SUP-260917", memberId: "ASPH-10471", memberName: "Fatima Bello", category: "Verification", priority: "high", subject: "Phone code never arrives", status: "open", messages: [{ author: "Fatima Bello", body: "I requested the SMS code three times.", at: "2026-09-08" }], updatedAt: "2026-09-08" },
  { id: "SUP-260915", memberId: "ASPH-10452", memberName: "Brian Osei", category: "Payment", priority: "normal", subject: "Duplicate contribution charge", status: "in-progress", messages: [{ author: "Brian Osei", body: "My card was charged twice.", at: "2026-09-06" }, { author: "Finance", body: "We are checking with the provider.", at: "2026-09-07" }], updatedAt: "2026-09-07" },
  { id: "SUP-260910", memberId: "ASPH-10447", memberName: "Grace Adeyemi", category: "Travel", priority: "low", subject: "Extend travel access by 3 days", status: "resolved", messages: [{ author: "Grace Adeyemi", body: "My return flight moved.", at: "2026-09-02" }, { author: "Member Care", body: "Extended to 30 September.", at: "2026-09-03" }], updatedAt: "2026-09-03" },
];

export const auditEvents: AuditEvent[] = [
  { id: "AUD-1001", actor: "S. Bakare", role: "security", action: "Rejected identity case ID-3002", target: "ASPH-10459", at: "2026-09-02" },
  { id: "AUD-1002", actor: "C. Eze", role: "content", action: "Published content ct-edu-1", target: "Education", at: "2026-09-03" },
  { id: "AUD-1003", actor: "R. Haddad", role: "security", action: "Applied verification-required to ASPH-10477", target: "ASPH-10477", at: "2026-09-07" },
  { id: "AUD-1004", actor: "L. Mensimah", role: "moderator", action: "Requested changes on SUB-2201", target: "SUB-2201", at: "2026-09-08" },
];
