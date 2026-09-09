"use client"

import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { MemberPlatform } from "@/components/member/MemberPlatform"
import { PrototypeFrame } from "@/components/public/PublicShell"
import { createMockApi } from "@/lib/api/mock-api"
import { demoData } from "@/lib/mock-data"

export function MemberRoute() {
  const router = useRouter()
  const api = useMemo(() => createMockApi(demoData), [])

  return (
    <PrototypeFrame>
      <main id="app-main" className="app-main"><MemberPlatform api={api} data={demoData} onPublic={() => router.push("/")} /></main>
    </PrototypeFrame>
  )
}
