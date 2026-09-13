"use client";

import { QueryClient } from "@tanstack/react-query";

// Single shared client so any part of the app (e.g. logout) can drop
// cached member data. Queries are keyed per data type and the whole
// cache is cleared on logout so the next account never sees stale rows.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false },
  },
});
