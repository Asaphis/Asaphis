"use client";

import { usePublishedContent } from "@/lib/api/use-published-content";
import type { PublicContent } from "@/lib/types";
import { AboutPage } from "@/components/public/pages/AboutPage";
import { MessagePage } from "@/components/public/pages/MessagePage";
import { VisionPage } from "@/components/public/pages/VisionPage";
import { EducationPage } from "@/components/public/pages/EducationPage";
import { SupportPage } from "@/components/public/pages/SupportPage";
import { PublicHomePage } from "@/components/public/pages/PublicHomePage";

export type PublicSectionKind = "home" | "about" | "message" | "vision" | "education" | "support";

export function PublicSectionLoader({
  fallback,
  section,
}: {
  fallback: PublicContent;
  section: PublicSectionKind;
}) {
  const { data } = usePublishedContent(fallback);
  const content = data ?? fallback;
  switch (section) {
    case "about":
      return <AboutPage content={content} />;
    case "message":
      return <MessagePage content={content} />;
    case "vision":
      return <VisionPage content={content} />;
    case "education":
      return <EducationPage content={content} />;
    case "support":
      return <SupportPage content={content} />;
    case "home":
    default:
      return <PublicHomePage content={content} />;
  }
}
