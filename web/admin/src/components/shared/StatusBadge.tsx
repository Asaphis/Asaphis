import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const toneByStatus: Record<string, string> = {
  Verified: "border-green-700/30 bg-green-50 text-green-800",
  Active: "border-green-700/30 bg-green-50 text-green-800",
  Successful: "border-green-700/30 bg-green-50 text-green-800",
  Approved: "border-green-700/30 bg-green-50 text-green-800",
  Published: "border-green-700/30 bg-green-50 text-green-800",
  Pending: "border-amber-700/30 bg-amber-50 text-amber-800",
  Processing: "border-amber-700/30 bg-amber-50 text-amber-800",
  "Under Review": "border-amber-700/30 bg-amber-50 text-amber-800",
  Scheduled: "border-blue-700/30 bg-blue-50 text-blue-800",
  "Changes Requested": "border-[#733635]/30 bg-[#f2e7dd] text-[#733635]",
  Failed: "border-red-700/30 bg-red-50 text-red-800",
  Cancelled: "border-red-700/30 bg-red-50 text-red-800",
  Rejected: "border-red-700/30 bg-red-50 text-red-800",
  Expired: "border-slate-700/30 bg-slate-100 text-slate-700",
  Trusted: "border-green-700/30 bg-green-50 text-green-800",
  Sent: "border-green-700/30 bg-green-50 text-green-800",
  Resolved: "border-green-700/30 bg-green-50 text-green-800",
  Healthy: "border-green-700/30 bg-green-50 text-green-800",
  Ready: "border-green-700/30 bg-green-50 text-green-800",
  Enabled: "border-green-700/30 bg-green-50 text-green-800",
  High: "border-red-700/30 bg-red-50 text-red-800",
  Restricted: "border-red-700/30 bg-red-50 text-red-800",
  Banned: "border-red-700/30 bg-red-50 text-red-800",
  Suspended: "border-red-700/30 bg-red-50 text-red-800",
  Flagged: "border-red-700/30 bg-red-50 text-red-800",
  Medium: "border-amber-700/30 bg-amber-50 text-amber-800",
  Watch: "border-amber-700/30 bg-amber-50 text-amber-800",
  Limited: "border-amber-700/30 bg-amber-50 text-amber-800",
  Draft: "border-slate-700/30 bg-slate-100 text-slate-700",
  Hidden: "border-slate-700/30 bg-slate-100 text-slate-700",
  Archived: "border-slate-700/30 bg-slate-100 text-slate-700",
  Open: "border-amber-700/30 bg-amber-50 text-amber-800",
  Low: "border-green-700/30 bg-green-50 text-green-800",
}

export function StatusBadge({
  status,
  className,
}: {
  status: string
  className?: string
}) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
        toneByStatus[status] ?? "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {status}
    </Badge>
  )
}
