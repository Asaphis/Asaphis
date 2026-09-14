"use client";

import { usePublishedContent } from "@/lib/api/use-published-content";
import type { PublicContent } from "@/lib/types";

// Canonical Home hook — wraps the published-content query so components
// don't depend on the underlying adapter (mock vs real backend).
export function useHomePage(fallback?: PublicContent) {
  return usePublishedContent(fallback);
}
