import { ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { PublicPageHeader } from "@/components/public/PublicPageHeader"
import { RouteCTA } from "@/components/public/RouteCTA"
import type { PublicContent } from "@/lib/types"

export function AboutPage({ content }: { content: PublicContent }) {
  return (
    <div className="public-view public-page">
      <PublicPageHeader eyebrow={content.about.eyebrow} title={content.about.title} intro="Learn what AsaPhis is building, how it handles knowledge, and why the platform is designed for the long view." action={<RouteCTA href="/join" label="Join the Journey" />} />
      <section className="content-section section-light">
        <div className="site-shell about-grid">
          <div className="about-image"><img src={content.about.imageUrl} alt={content.about.imageAlt} /></div>
          <div className="copy-block">
            <p className="eyebrow">Our purpose</p>
            <h2>A place for education, context, and thoughtful participation.</h2>
            {content.about.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            <div className="inline-callout"><ShieldCheck size={18} aria-hidden="true" /><span>Claims and submissions include sources where available.</span></div>
          </div>
        </div>
      </section>
      <section className="content-section">
        <div className="site-shell about-principles-grid">
          <Card className="about-principle-card"><p className="eyebrow">Make knowledge useful</p><h3>Clear before clever.</h3><p>Education should give people enough context to ask better questions and make stronger decisions.</p></Card>
          <Card className="about-principle-card"><p className="eyebrow">Keep participation careful</p><h3>Review is part of the work.</h3><p>Member contributions move through a visible process instead of disappearing into an unmoderated feed.</p></Card>
        </div>
      </section>
      <section className="final-cta">
        <div className="site-shell final-cta-inner"><div><p className="eyebrow eyebrow-light">Where next</p><h2>See the foundation we are building.</h2><p>Read the current and future vision, then decide how you want to participate.</p></div><div className="final-actions"><RouteCTA href="/vision" label="Read the vision" /><RouteCTA href="/education" label="Preview education" variant="outline" className="ap-control-light" /></div></div>
      </section>
    </div>
  )
}
