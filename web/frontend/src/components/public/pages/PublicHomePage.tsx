import Link from "next/link"
import { ArrowRight, BookOpen, HeartHandshake, MessageCircle, ShieldCheck } from "lucide-react"
import { Card } from "@/components/ui/card"
import { RouteCTA } from "@/components/public/RouteCTA"
import type { PublicContent } from "@/lib/types"

const pagePreviews = [
  { href: "/about", eyebrow: "About", title: "A long-term home for learning.", body: "Understand the purpose, practice, and care behind AsaPhis.", icon: ShieldCheck },
  { href: "/vision", eyebrow: "Vision", title: "Build the foundation first.", body: "See the work available now and the infrastructure we are working toward.", icon: HeartHandshake },
  { href: "/education", eyebrow: "Education", title: "Start with a question worth keeping.", body: "Preview public learning materials before joining the deeper library.", icon: BookOpen },
  { href: "/support", eyebrow: "Support", title: "Keep the foundation open.", body: "Support education, moderation, and secure member access by region.", icon: MessageCircle },
] as const

export function PublicHomePage({ content }: { content: PublicContent }) {
  return (
    <div className="public-view">
      <section className="hero-section">
        <div className="hero-media">
          <img src={content.hero.imageUrl} alt={content.hero.imageAlt} />
          <div className="hero-caption"><span>{content.hero.caption}</span><span>{content.hero.index}</span></div>
        </div>
        <div className="hero-copy weave-surface">
          <div>
            <p className="eyebrow eyebrow-light">{content.hero.eyebrow}</p>
            <h1>{content.hero.title}</h1>
            <p className="hero-lede">{content.hero.lede}</p>
            <div className="hero-actions">
              <RouteCTA href="/join" label="Join the Journey" />
              <Link className="text-action text-action-light" href="/message">Read the featured message <ArrowRight size={14} aria-hidden="true" /></Link>
            </div>
          </div>
          <div className="hero-footnote"><span>Built for the long view</span><span>AsaPhis · 2026</span></div>
        </div>
      </section>

      <section className="content-section section-light">
        <div className="site-shell">
          <div className="section-heading-row">
            <div><p className="eyebrow">Explore AsaPhis</p><h2>Go deeper by page, not by scroll.</h2></div>
            <p className="section-intro">Each destination has its own purpose, content, and next step.</p>
          </div>
          <div className="public-explore-grid">
            {pagePreviews.map(({ href, eyebrow, title, body, icon: Icon }) => (
              <Card className="public-explore-card" key={href}>
                <span className="public-explore-icon"><Icon size={18} aria-hidden="true" /></span>
                <p className="eyebrow">{eyebrow}</p>
                <h3>{title}</h3>
                <p>{body}</p>
                <Link className="read-more" href={href}>Open {eyebrow.toLowerCase()} <ArrowRight size={14} aria-hidden="true" /></Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section">
        <div className="site-shell home-message-preview">
          <div className="home-message-preview-media"><img src={content.featuredMessage.posterUrl} alt={content.featuredMessage.posterAlt} loading="lazy" /><span>{content.featuredMessage.durationMinutes} min watch</span></div>
          <div className="home-message-preview-copy">
            <p className="eyebrow">Featured message</p>
            <h2>{content.featuredMessage.title}</h2>
            <p>{content.featuredMessage.description}</p>
            <Link className="text-action chocolate-link" href="/message">Open the message page <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="site-shell final-cta-inner">
          <div><p className="eyebrow eyebrow-light">The next step is yours</p><h2>Learn something useful. Add something careful.</h2><p>Join a platform designed to become more valuable over time without making the member experience harder to use.</p></div>
          <div className="final-actions"><RouteCTA href="/join" label="Join the Journey" /><RouteCTA href="/login" label="Member login" variant="outline" className="ap-control-light" /></div>
        </div>
      </section>
    </div>
  )
}
