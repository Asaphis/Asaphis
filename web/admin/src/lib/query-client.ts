"use client";

import { QueryClient } from "@tanstack/react-query";

// Single shared client so logout can drop every cached admin row.
// The next signed-in admin therefore never sees the previous session's data.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false },
  },
});
