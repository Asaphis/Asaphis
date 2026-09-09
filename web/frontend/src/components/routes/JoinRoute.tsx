"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { JoinJourney } from "@/components/onboarding/JoinJourney"
import { PrototypeFrame } from "@/components/public/PublicShell"
import { createMockApi } from "@/lib/api/mock-api"
import { demoData } from "@/lib/mock-data"

export function JoinRoute() {
  const router = useRouter()
  const api = useMemo(() => createMockApi(demoData), [])

  return (
    <PrototypeFrame>
      <main id="app-main" className="app-main"><JoinJourney api={api} onBackToPublic={() => router.push("/")} onActivated={() => router.push("/member")} /></main>
    </PrototypeFrame>
  )
}
