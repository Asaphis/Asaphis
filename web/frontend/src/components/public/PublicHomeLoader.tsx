"use client";

import { PublicHomePage } from "@/components/public/pages/PublicHomePage";
import { usePublishedContent } from "@/lib/api/use-published-content";
import type { PublicContent } from "@/lib/types";

export function PublicHomeLoader({ fallback }: { fallback: PublicContent }) {
  const { data } = usePublishedContent(fallback);
  return <PublicHomePage content={data ?? fallback} />;
}
