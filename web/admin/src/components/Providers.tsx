"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { AdminAuthProvider } from "@/lib/admin-auth";
import { queryClient } from "@/lib/query-client";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AdminAuthProvider>{children}</AdminAuthProvider>
    </QueryClientProvider>
  );
}
