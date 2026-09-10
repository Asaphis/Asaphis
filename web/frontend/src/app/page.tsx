import type { Metadata } from "next"
import { PublicShell } from "@/components/public/PublicShell"
import { PublicHomeLoader } from "@/components/public/PublicHomeLoader"
import { demoData } from "@/lib/mock-data"

export const metadata: Metadata = {
  title: "AsaPhis ORG · Knowledge, community, future",
  description: "A serious home for African education, community knowledge, and the people carrying it forward.",
}

export default function HomePage() {
  // Dynamic: loader calls GET /content/published via NEXT_PUBLIC_API_BASE_URL,
  // falls back to demoData (old content) until admin republishes.
  return <PublicShell><PublicHomeLoader fallback={demoData.publicContent} /></PublicShell>
}
