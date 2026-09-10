"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createApi } from "@/lib/api/api-factory";
import { demoData } from "@/lib/mock-data";
import type { PublicContent } from "@/lib/types";

// Dynamic landing hook: calls GET /content/published via env API base.
// Falls back to demoData (old Pexels content) so page never breaks
// until admin republishes from admin panel.
export function usePublishedContent(initial?: PublicContent) {
  const [api] = useState(() => createApi());
  const query = useQuery({
    queryKey: ["landing", "published"],
    queryFn: () => api.getPublishedLandingContent(),
    initialData: initial ?? demoData.publicContent,
    staleTime: 60_000,
  });
  useEffect(() => {
    // no-op: keeps hook client-side safe
  }, []);
  return query;
}
