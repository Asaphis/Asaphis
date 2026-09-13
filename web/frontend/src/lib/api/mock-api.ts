import type { AsaPhisApi } from "@/lib/api/contracts"
import type { DemoData, PaymentMethod, PhoneChannel } from "@/lib/types"

const wait = <T,>(value: T, delay = 240) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), delay))

export function createMockApi(seed: DemoData): AsaPhisApi {
  return {
    async getPublishedLandingContent() {
      return wait(seed.publicContent)
    },
    async login(input: { email: string; password: string }) {
      const email = input.email.trim().toLowerCase()
      if (!email.includes("@") || input.password.length < 8) {
        throw new Error("Enter a valid email address and a password of at least 8 characters.")
      }
      return wait(
        { token: `mock-session-${Date.now()}`, memberId: seed.member.memberId },
        420,
      )
    },
    async logout() {
      return wait({ success: true }, 180)
    },
    async detectCurrentCountry() {
      return wait({ country: "Nigeria", source: "mock" as const })
    },
    async sendPhoneCode(input: { number: string; channel: PhoneChannel }) {
      void input
      return wait({ challengeId: "mock-phone-challenge", resendAfterSeconds: 42 })
    },
    async verifyPhoneCode(input: { challengeId: string; code: string }) {
      void input
      return wait({ verified: true })
    },
    async getCountryConfig(country) {
      return wait(seed.countryConfigs[country] ?? seed.countryConfigs.Nigeria)
    },
    async submitIdentity() {
      return wait({ status: "verified" as const }, 320)
    },
    async runSecurityCheck() {
      return wait({ passed: true }, 420)
    },
    async createContribution(input: {
      amount: number
      currency: string
      method: PaymentMethod
    }) {
      void input
      return wait({ id: "contrib-2026-001", status: "Successful" as const }, 360)
    },
    async getActivationStatus() {
      return wait({ active: true, memberId: seed.member.memberId })
    },
    async getMemberProfile() {
      return wait(seed.member)
    },
    async getEducation(query) {
      const search = query.search?.trim().toLowerCase() ?? ""
      return wait(
        seed.resources.filter((resource) => {
          const categoryMatches =
            !query.category || query.category === "All" || resource.category === query.category
          const searchMatches =
            !search ||
            `${resource.title} ${resource.description} ${resource.category}`
              .toLowerCase()
              .includes(search)
          return categoryMatches && searchMatches
        }),
      )
    },
    async getVideos() {
      return wait(seed.resources.filter((resource) => resource.kind === "Video"))
    },
    async getDocuments() {
      return wait(seed.documents)
    },
    async requestDocumentDownload(id) {
      return wait({
        fileToken: `file-token-${id}`,
        expiresAt: "2026-09-09T14:00:00.000Z",
      })
    },
    async getNotifications(category) {
      return wait(
        category
          ? seed.notifications.filter((item) => item.category === category)
          : seed.notifications,
      )
    },
    async submitCommunityContribution(input) {
      return wait({
        id: "sub-2026-002",
        title: input.title,
        body: input.body,
        status: "Under Review" as const,
        updatedAt: "2026-09-09",
      })
    },
    async createTravelRequest(input) {
      return wait({
        ...input,
        id: "travel-2026-003",
        status: "Pending" as const,
      })
    },
    async createSupportRequest(input) {
      return wait({
        ...input,
        id: "SUP-260919",
        status: "open" as const,
        createdAt: "2026-09-09",
        responses: [],
      })
    },
    async listSupportRequests() {
      return wait([])
    },
    async getPaymentConfig() {
      return wait([{ countryCode: "GLOBAL", currency: "USD", amount: 25, providers: ["Stripe"], methods: ["Card"] }])
    },
    async uploadFile() {
      return wait({ fileId: "mock-file", fileToken: "mock-file" })
    },
    async register(input) {
      void input
      return wait({ userId: "mock-user", memberId: seed.member.memberId, stage: "PHONE_VERIFICATION" })
    },
    async requestPasswordReset() {
      return wait({ ok: true })
    },
    async resetPassword() {
      return wait({ ok: true })
    },
    async changePassword() {
      return wait({ ok: true })
    },
  }
}
