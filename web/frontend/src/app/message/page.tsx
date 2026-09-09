import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { MessagePage } from "@/components/public/pages/MessagePage"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = { title: "Featured message · AsaPhis ORG", description: "Read and watch the AsaPhis featured message with its transcript." }

export default function MessageRoute() {
  return <PublicShell><MessagePage content={demoData.publicContent} /></PublicShell>
}
