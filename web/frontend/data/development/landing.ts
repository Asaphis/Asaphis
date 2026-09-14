// Development CMS fallback — mirrors production DB seed.
// Source of truth for local dev when NEXT_PUBLIC_API_BASE_URL is empty.
// Production path: pageService -> real backend GET /content/published -> mapBackendToPublicContent.
// Do NOT import this directly from React components — use src/lib/pages/pageService instead.
export { demoData as developmentLanding } from "@/lib/mock-data";
export { demoData as developmentData } from "@/lib/mock-data";
