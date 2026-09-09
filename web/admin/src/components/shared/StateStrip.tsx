import { AlertTriangle, CheckCircle2, Inbox, LoaderCircle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export type AsyncState = "idle" | "loading" | "success" | "error" | "empty"

const stateCopy: Record<AsyncState, { label: string; icon: typeof CheckCircle2 }> = {
  idle: { label: "Ready", icon: CheckCircle2 },
  loading: { label: "Loading", icon: LoaderCircle },
  success: { label: "Ready", icon: CheckCircle2 },
  empty: { label: "Empty", icon: Inbox },
  error: { label: "Error", icon: AlertTriangle },
}

export function StateStrip({
  state,
  message,
  onRetry,
}: {
  state: AsyncState
  message: string
  onRetry?: () => void
}) {
  const { icon: Icon } = stateCopy[state]
  return (
    <div className={`state-strip state-${state}`} role={state === "error" ? "alert" : "status"}>
      <Icon aria-hidden="true" className={state === "loading" ? "animate-spin" : undefined} size={16} />
      <span>{message}</span>
      {state === "error" && onRetry ? (
        <Button type="button" variant="ghost" size="sm" onClick={onRetry} className="ml-auto rounded-none px-2">
          <RefreshCcw size={13} aria-hidden="true" /> Retry
        </Button>
      ) : null}
    </div>
  )
}
