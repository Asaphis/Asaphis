import type { Metadata } from "next"
import { JoinRoute } from "@/components/routes/JoinRoute"

export const metadata: Metadata = { title: "Join the journey · AsaPhis ORG", description: "Complete the AsaPhis membership activation flow." }

export default function JoinPage() {
  return <JoinRoute />
}
