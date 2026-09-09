import type { Metadata } from "next"
import { Providers } from "@/components/Providers"
import "./globals.css"

export const metadata: Metadata = {
  title: "AsaPhis ORG · Knowledge, community, future",
  description: "A serious home for African education, community knowledge, and the people carrying it forward.",
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Providers>{children}</Providers></body></html>
}
