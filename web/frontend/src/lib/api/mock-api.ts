import type { AsaPhisApi } from "@/lib/api/contracts"
import type { DemoData, PaymentMethod, PhoneChannel } from "@/lib/types"

const wait = <T,>(value: T, delay = 240) =>
  new Promise<T>((resolve) => setTimeout(() => resolve(value), delay))

export function createMockApi(seed: DemoData): AsaPhisApi {
  return {
    async getPublishedLandingContent() {
      return wait(seed.publicContent)
    },
    async detectCurrentCountry() {
      return wait({ country: "Nigeria", source: "demo" as const })
    },
    async sendPhoneCode(input: { number: string; channel: PhoneChannel }) {
      void input
      return wait({ challengeId: "demo-phone-challenge", resendAfterSeconds: 42 })
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
      return wait({ id: "contribution-demo-1", status: "Successful" as const }, 360)
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
        fileToken: `demo-file-token-${id}`,
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
        id: "submission-demo-2",
        title: input.title,
        body: input.body,
        status: "Under Review" as const,
        updatedAt: "2026-09-09",
      })
    },
    async createTravelRequest(input) {
      return wait({
        ...input,
        id: "travel-demo-3",
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
  }
}
