"use client"

import { useMemo, useState } from "react"
import { ArrowRight, BookOpen, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PublicPageHeader } from "@/components/public/PublicPageHeader"
import { RouteCTA } from "@/components/public/RouteCTA"
import type { PublicContent } from "@/lib/types"

const categories = ["All", "History", "Culture", "Development", "Technology", "Community knowledge"] as const
type EducationCategory = (typeof categories)[number]

export function EducationPage({ content }: { content: PublicContent }) {
  const [category, setCategory] = useState<EducationCategory>("All")
  const [search, setSearch] = useState("")
  const normalizedSearch = search.trim().toLowerCase()
  const resources = useMemo(() => content.educationPreview.filter((resource) => {
    const matchesCategory = category === "All" || resource.category === category
    const matchesSearch = !normalizedSearch || `${resource.title} ${resource.description} ${resource.category}`.toLowerCase().includes(normalizedSearch)
    return matchesCategory && matchesSearch
  }), [category, content.educationPreview, normalizedSearch])

  return (
    <div className="public-view public-page">
      <PublicPageHeader eyebrow="Education preview" title="Start with a question worth keeping." intro="Browse a small public collection. Member access adds more resources, documents, and authorized learning materials." action={<RouteCTA href="/join" label="Join for more" />} />
      <section className="content-section section-light">
        <div className="site-shell">
          <div className="education-toolbar">
            <div className="search-field"><Search size={16} aria-hidden="true" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search public resources" aria-label="Search public education resources" /></div>
            <div className="education-filter-row" role="group" aria-label="Public education categories">{categories.map((item) => <Button type="button" variant={category === item ? "default" : "outline"} className={`filter-button ${category === item ? "is-active" : ""}`} key={item} onClick={() => setCategory(item)}>{item}</Button>)}</div>
          </div>
          <p className="education-result-note" role="status">{resources.length} public {resources.length === 1 ? "resource" : "resources"} shown</p>
          {resources.length ? <div className="education-grid public-resource-grid">{resources.map((resource) => <Card className="education-card" key={resource.id}><img src={resource.imageUrl} alt={resource.imageAlt} loading="lazy" /><div className="education-card-copy"><span className="card-label">{resource.category} · {resource.kind}</span><h2>{resource.title}</h2><p>{resource.description}</p><div className="resource-meta"><span>{resource.publishedAt}</span>{resource.durationMinutes ? <span>{resource.durationMinutes} min watch</span> : null}</div><span className="read-more">Preview resource <ArrowRight size={14} aria-hidden="true" /></span></div></Card>)}</div> : <div className="education-empty"><BookOpen size={25} aria-hidden="true" /><h2>No public resources match this filter.</h2><p>Try another category or clear the search to see the full preview collection.</p><Button type="button" variant="outline" className="ap-control ap-control-outline" onClick={() => { setSearch(""); setCategory("All") }}>Clear filters</Button></div>}
        </div>
      </section>
      <section className="final-cta"><div className="site-shell final-cta-inner"><div><p className="eyebrow eyebrow-light">More is available inside</p><h2>Keep learning with a verified member account.</h2><p>Join to access the wider library and the tools for careful contribution.</p></div><div className="final-actions"><RouteCTA href="/join" label="Join the Journey" /><RouteCTA href="/about" label="About AsaPhis" variant="outline" className="ap-control-light" /></div></div></section>
    </div>
  )
}
