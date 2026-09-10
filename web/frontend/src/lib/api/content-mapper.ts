import type { PublicContent, Resource } from "@/lib/types";
import { demoData } from "@/lib/mock-data";

export interface BackendContentItem {
  id: string;
  section: string;
  title: string;
  body?: string | null;
  visibility?: string;
  status?: string;
  sortOrder?: number;
  // Optional media fields if backend stores JSON in body or extra columns
  imageUrl?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
}

export interface BackendPublishedResponse {
  items: BackendContentItem[];
  sections: { key: string; visible: boolean; sortOrder: number }[];
}

function pick(section: string, items: BackendContentItem[]): BackendContentItem[] {
  return items.filter((i) => i.section?.toLowerCase() === section.toLowerCase());
}

function first(section: string, items: BackendContentItem[]): BackendContentItem | undefined {
  return pick(section, items)[0];
}

// Map backend ContentItem rows -> frontend PublicContent shape.
// Falls back to demoData for any missing section so old landing content
// keeps serving until admin republishes everything.
export function mapBackendToPublicContent(data: BackendPublishedResponse): PublicContent {
  const fallback = demoData.publicContent;
  const items = Array.isArray(data?.items) ? data.items : [];

  if (items.length === 0) return fallback;

  const hero = first("hero", items);
  const message = first("message", items);
  const about = first("about", items);
  const vision = first("vision", items);
  const support = first("support", items);
  const educationItems = pick("education", items);

  const educationPreview: Resource[] = educationItems.length
    ? educationItems.slice(0, 6).map((e, idx) => ({
        id: e.id,
        category: "Education" as const,
        kind: (e.title?.toLowerCase().includes("video") ? "Video" : "Article") as Resource["kind"],
        title: e.title,
        description: e.body ?? fallback.educationPreview[idx]?.description ?? "",
        imageUrl: e.imageUrl ?? fallback.educationPreview[idx]?.imageUrl,
        imageAlt: e.title,
        visibility: "public" as const,
        publishedAt: new Date().toISOString().slice(0, 10),
      }))
    : fallback.educationPreview;

  return {
    hero: hero
      ? {
          eyebrow: "Knowledge · community · future",
          title: hero.title,
          lede: hero.body ?? fallback.hero.lede,
          imageUrl: hero.imageUrl ?? fallback.hero.imageUrl,
          imageAlt: hero.title,
          caption: fallback.hero.caption,
          index: fallback.hero.index,
        }
      : fallback.hero,
    featuredMessage: message
      ? {
          title: message.title,
          description: message.body ?? fallback.featuredMessage.description,
          videoUrl: message.videoUrl ?? fallback.featuredMessage.videoUrl,
          posterUrl: message.posterUrl ?? fallback.featuredMessage.posterUrl,
          posterAlt: message.title,
          transcriptAvailable: true,
          publishedAt: fallback.featuredMessage.publishedAt,
          durationMinutes: fallback.featuredMessage.durationMinutes,
        }
      : fallback.featuredMessage,
    about: about
      ? {
          eyebrow: fallback.about.eyebrow,
          title: about.title,
          paragraphs: [about.body ?? ""].filter(Boolean),
          imageUrl: about.imageUrl ?? fallback.about.imageUrl,
          imageAlt: about.title,
        }
      : fallback.about,
    vision: vision
      ? {
          ...fallback.vision,
          title: vision.title,
          intro: vision.body ?? fallback.vision.intro,
        }
      : fallback.vision,
    educationPreview,
    support: support
      ? { ...fallback.support, title: support.title, body: support.body ?? fallback.support.body }
      : fallback.support,
    communityPreview: fallback.communityPreview,
  };
}
