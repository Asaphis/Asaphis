"use client"

import { QueryClientProvider } from "@tanstack/react-query"
import { AuthProvider } from "@/lib/auth/auth-context"
import { queryClient } from "@/lib/query-client"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )
}
