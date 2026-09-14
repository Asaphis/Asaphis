// CMS page model — Pages -> Sections -> Contents.
// Home page sections come from live LandingSection rows (backend seed).
// Other public pages map 1:1 to their ContentItem section.
// No hardcoded landing content here — only structure/routes.

export interface CmsPage {
  key: string;
  title: string;
  description: string;
  publicPath: string;
  // LandingSection keys under this page. "home" is dynamic (all sections);
  // others default to a single section with the same key.
  sectionKeys: string[] | "landing";
}

export const CMS_PAGES: CmsPage[] = [
  { key: "home", title: "Home", description: "Public landing page", publicPath: "/", sectionKeys: "landing" },
  { key: "about", title: "About", description: "About AsaPhis", publicPath: "/about", sectionKeys: ["about"] },
  { key: "message", title: "Featured Message", description: "Featured video message", publicPath: "/message", sectionKeys: ["message"] },
  { key: "vision", title: "Vision", description: "Vision and foundation", publicPath: "/vision", sectionKeys: ["vision"] },
  { key: "education", title: "Education", description: "Public education page", publicPath: "/education", sectionKeys: ["education"] },
  { key: "support", title: "Support", description: "Support and contributions", publicPath: "/support", sectionKeys: ["support"] },
];

export function getCmsPage(key: string): CmsPage | undefined {
  return CMS_PAGES.find((p) => p.key === key);
}

export function locationOf(pageKey: string, sectionKey?: string, field?: string): string {
  const page = getCmsPage(pageKey);
  const base = `Public Website → ${page?.title ?? pageKey}`;
  if (!sectionKey) return base;
  if (!field) return `${base} → ${sectionKey}`;
  return `${base} → ${sectionKey} → ${field}`;
}

export function isVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}
