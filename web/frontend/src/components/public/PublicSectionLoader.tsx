"use client";

import type { ReactNode } from "react";
import { usePublishedContent } from "@/lib/api/use-published-content";
import type { PublicContent } from "@/lib/types";

export function PublicSectionLoader({
  fallback,
  children,
}: {
  fallback: PublicContent;
  children: (content: PublicContent) => ReactNode;
}) {
  const { data } = usePublishedContent(fallback);
  return <>{children(data ?? fallback)}</>;
}
