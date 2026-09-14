import { createApi } from "@/lib/api/api-factory";
import type { PublicContent } from "@/lib/types";

// Page service abstraction — Home Page -> pageService -> API -> backend CMS database.
// UI must never call fetch/Prisma directly. Swap adapters here without touching components.
export const pageService = {
  async getHomePage(): Promise<PublicContent> {
    return createApi().getPublishedLandingContent();
  },
};
