import type { PublicContent, Resource } from "@/lib/types";
import { demoData } from "@/lib/mock-data";

export interface BackendContentItem {
  id: string;
  section: string;
  title: string;
  kind?: string | null;
  body?: string | null;
  mediaUrls?: string[] | null;
  visibility?: string;
  status?: string;
  sortOrder?: number;
  // Optional media fields if backend stores JSON in body or extra columns
  imageUrl?: string | null;
  videoUrl?: string | null;
  posterUrl?: string | null;
  subtitle?: string | null;
  description?: string | null;
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
// Backend media: mediaUrls[0]=image/poster, mediaUrls[1]=video, or
// imageUrl/videoUrl/posterUrl columns when present.
function mediaOf(item: BackendContentItem | undefined): { image?: string; video?: string; poster?: string } {
  if (!item) return {};
  const urls = Array.isArray(item.mediaUrls) ? item.mediaUrls : [];
  const isVideo = (u: string) => /\.(mp4|webm|mov)(\?|$)/i.test(u) || u.includes("video");
  const video = item.videoUrl ?? urls.find(isVideo);
  const image = item.imageUrl ?? urls.find((u) => u !== video);
  return { image: image ?? undefined, video: video ?? undefined, poster: item.posterUrl ?? image ?? undefined };
}
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
        kind: (e.kind === "Video" || e.title?.toLowerCase().includes("video") ? "Video" : "Article") as Resource["kind"],
        title: e.title,
        description: e.body ?? e.description ?? fallback.educationPreview[idx]?.description ?? "",
        imageUrl: mediaOf(e).image ?? fallback.educationPreview[idx]?.imageUrl,
        imageAlt: e.title,
        visibility: "public" as const,
        publishedAt: new Date().toISOString().slice(0, 10),
      }))
    : fallback.educationPreview;

  const heroMedia = mediaOf(hero);
  const messageMedia = mediaOf(message);
  const aboutMedia = mediaOf(about);

  return {
    hero: hero
      ? {
          eyebrow: "Knowledge · community · future",
          title: hero.title,
          lede: hero.subtitle ?? hero.body ?? fallback.hero.lede,
          imageUrl: heroMedia.image ?? fallback.hero.imageUrl,
          imageAlt: hero.title,
          caption: fallback.hero.caption,
          index: fallback.hero.index,
        }
      : fallback.hero,
    featuredMessage: message
      ? {
          title: message.title,
          description: message.description ?? message.body ?? fallback.featuredMessage.description,
          videoUrl: messageMedia.video ?? fallback.featuredMessage.videoUrl,
          posterUrl: messageMedia.poster ?? fallback.featuredMessage.posterUrl,
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
          paragraphs: [about.description ?? about.body ?? ""].filter(Boolean),
          imageUrl: aboutMedia.image ?? fallback.about.imageUrl,
          imageAlt: about.title,
        }
      : fallback.about,
    vision: vision
      ? {
          ...fallback.vision,
          title: vision.title,
          intro: vision.subtitle ?? vision.body ?? fallback.vision.intro,
        }
      : fallback.vision,
    educationPreview,
    support: support
      ? { ...fallback.support, title: support.title, body: support.description ?? support.body ?? fallback.support.body }
      : fallback.support,
    communityPreview: fallback.communityPreview,
  };
}
