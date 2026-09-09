"use client"

import { useState } from "react"
import { ExternalLink, HeartHandshake, Info, MessageCircle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PublicPageHeader } from "@/components/public/PublicPageHeader"
import { RouteCTA } from "@/components/public/RouteCTA"
import { formatContribution, type PaymentMethod, type PublicContent } from "@/lib/types"

export function SupportPage({ content }: { content: PublicContent }) {
  const [amount, setAmount] = useState(content.support.amount)
  const [currency, setCurrency] = useState(content.support.currency)
  const [method, setMethod] = useState<PaymentMethod>(content.support.methods[0])

  return (
    <div className="public-view public-page">
      <PublicPageHeader eyebrow="Why support" title={content.support.title} intro="Contributions help keep public education, moderation, and secure member access available across regions." action={<RouteCTA href="/join" label="Join the Journey" />} />
      <section className="content-section section-light">
        <div className="site-shell support-layout">
          <div className="support-copy"><p className="eyebrow">What your support enables</p><h2>{content.support.body}</h2><ul className="reason-list">{content.support.reasons.map((reason) => <li key={reason}><HeartHandshake size={17} aria-hidden="true" />{reason}</li>)}</ul><div className="support-community-note"><MessageCircle size={17} aria-hidden="true" /><span>Support also helps us keep community review visible and human.</span></div></div>
          <Card className="contribution-box">
            <div className="card-header-row"><div><p className="eyebrow">Contribution</p><h2>Choose an amount and method.</h2></div><Info size={18} aria-hidden="true" /></div>
            <div className="form-field"><Label htmlFor="public-amount">Amount</Label><div className="amount-row"><Input id="public-amount" className="amount-input" type="number" value={amount} onChange={(event) => setAmount(Number(event.target.value))} min={1} /><Select value={currency} onValueChange={setCurrency}><SelectTrigger aria-label="Contribution currency" className="currency-select"><SelectValue /></SelectTrigger><SelectContent>{["NGN", "GHS", "KES", "GBP", "USD"].map((item) => <SelectItem value={item} key={item}>{item}</SelectItem>)}</SelectContent></Select></div></div>
            <p className="contribution-total" aria-live="polite">Selected contribution · <strong>{formatContribution(amount || 0, currency)}</strong></p>
            <div className="method-segmented" role="group" aria-label="Payment method">{content.support.methods.map((item) => <Button type="button" variant={method === item ? "default" : "outline"} className={method === item ? "is-active" : ""} key={item} onClick={() => setMethod(item)}>{item}</Button>)}</div>
            <p className="config-note"><Info size={15} aria-hidden="true" /> Local options are set by region. Selected method: {method}.</p>
            <RouteCTA href="/join" label="Continue to membership" className="full-button" />
          </Card>
        </div>
      </section>
      <section className="content-section">
        <div className="site-shell support-next-grid"><div><p className="eyebrow">Community links</p><h2>Stay close to the work.</h2><p className="section-intro">Follow updates and conversations outside the platform while the public foundation grows.</p></div><div className="community-links">{content.communityPreview.links.map((link) => <a key={link.label} href={link.href} target="_blank" rel="noreferrer">{link.label}<ExternalLink size={14} aria-hidden="true" /></a>)}</div></div>
      </section>
      <section className="final-cta"><div className="site-shell final-cta-inner"><div><p className="eyebrow eyebrow-light">Ready to participate?</p><h2>Join the journey when the time is right.</h2><p>Membership verification, contribution, and activation happen in a dedicated flow.</p></div><div className="final-actions"><RouteCTA href="/join" label="Start membership" /><RouteCTA href="/message" label="Read the message" variant="outline" className="ap-control-light" /></div></div></section>
    </div>
  )
}
