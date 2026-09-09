import type { ComponentProps } from "react"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type ButtonVariant = ComponentProps<typeof Button>["variant"]

export function RouteCTA({
  href,
  label,
  variant = "default",
  className,
}: {
  href: string
  label: string
  variant?: ButtonVariant
  className?: string
}) {
  return (
    <Button asChild type="button" variant={variant} className={cn("ap-control", variant === "default" ? "ap-control-primary" : "ap-control-outline", className)}>
      <Link href={href}>{label} <ArrowRight size={15} aria-hidden="true" /></Link>
    </Button>
  )
}
