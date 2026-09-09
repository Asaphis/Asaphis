import { Check } from "lucide-react"
import { PublicPageHeader } from "@/components/public/PublicPageHeader"
import { RouteCTA } from "@/components/public/RouteCTA"
import type { PublicContent } from "@/lib/types"

export function VisionPage({ content }: { content: PublicContent }) {
  const panels = [
    { label: "Current work", data: content.vision.current, className: "vision-current" },
    { label: "Future goals", data: content.vision.future, className: "vision-future" },
  ]

  return (
    <div className="public-view public-page">
      <PublicPageHeader eyebrow="Vision" title={content.vision.title} intro={content.vision.intro} action={<RouteCTA href="/education" label="See current work" />} />
      <section className="content-section">
        <div className="site-shell">
          <div className="vision-grid vision-page-grid">
            {panels.map(({ label, data, className }) => <article className={`vision-panel ${className}`} key={label}><span className="panel-label">{label}</span><h2>{data.title}</h2><p>{data.body}</p><ul>{data.items.map((item) => <li key={item}><Check size={15} aria-hidden="true" />{item}</li>)}</ul></article>)}
          </div>
        </div>
      </section>
      <section className="content-section section-light">
        <div className="site-shell vision-principles-grid">
          <div><p className="eyebrow">A practical direction</p><h2>Build the foundation before the horizon.</h2></div>
          <div className="vision-principles-copy"><p>We are starting with the pieces that make trust possible: public previews, source-aware contributions, clear authorization, and member care that explains what happens next.</p><div className="final-actions"><RouteCTA href="/support" label="Support the foundation" /><RouteCTA href="/join" label="Join the journey" variant="outline" /></div></div>
        </div>
      </section>
    </div>
  )
}
