import type { ReactNode } from "react"

export function PublicPageHeader({
  eyebrow,
  title,
  intro,
  action,
}: {
  eyebrow: string
  title: string
  intro: string
  action?: ReactNode
}) {
  return (
    <section className="public-page-header">
      <div className="site-shell public-page-header-inner">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p>{intro}</p>
        </div>
        {action ? <div className="public-page-actions">{action}</div> : null}
      </div>
    </section>
  )
}
