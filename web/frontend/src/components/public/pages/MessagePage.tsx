"use client"

import { useRef, useState } from "react"
import { Pause, Play, LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { PublicPageHeader } from "@/components/public/PublicPageHeader"
import { RouteCTA } from "@/components/public/RouteCTA"
import { formatDate, type PublicContent } from "@/lib/types"

const transcript = [
  "Knowledge is not only something we collect. It is something we make easier for the next person to find, question, and use.",
  "That work asks for patience: sources that can be checked, stories that keep their context, and communities that can revise what they have shared.",
  "AsaPhis begins with that responsibility. We are building a home where education and participation can become more useful over time.",
]

export function MessagePage({ content }: { content: PublicContent }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [playbackNote, setPlaybackNote] = useState("")

  const toggleVideo = async () => {
    if (!videoRef.current) return
    if (videoRef.current.paused) {
      try {
        await videoRef.current.play()
        setVideoPlaying(true)
        setPlaybackNote("")
      } catch {
        setPlaybackNote("Playback is unavailable in this browser. The transcript is available below.")
      }
    } else {
      videoRef.current.pause()
      setVideoPlaying(false)
    }
  }

  return (
    <div className="public-view public-page">
      <PublicPageHeader eyebrow="Featured message" title={content.featuredMessage.title} intro="A dedicated space for the message, its context, and a readable transcript." action={<RouteCTA href="/education" label="Explore education" />} />
      <section className="content-section">
        <div className="site-shell message-layout">
          <div className="message-media video-frame">
            <video ref={videoRef} poster={content.featuredMessage.posterUrl} preload="metadata" playsInline muted loop aria-label={content.featuredMessage.posterAlt}>
              <source src={content.featuredMessage.videoUrl} type="video/mp4" />
            </video>
            <Button type="button" size="icon" className="play-control" onClick={toggleVideo} aria-label={videoPlaying ? "Pause featured message" : "Play featured message"}>
              {videoPlaying ? <Pause size={24} fill="currentColor" aria-hidden="true" /> : <Play size={24} fill="currentColor" aria-hidden="true" />}
            </Button>
            <span className="media-credit">Video preview · AsaPhis Media</span>
          </div>
          <Card className="message-copy">
            <div className="meta-row"><span>{formatDate(content.featuredMessage.publishedAt)}</span><span className="meta-dot" /><span>{content.featuredMessage.durationMinutes} min watch</span></div>
            <p className="eyebrow">Why this matters</p>
            <h2>{content.featuredMessage.title}</h2>
            <p>{content.featuredMessage.description} This is the starting point for a longer conversation about shared responsibility, context, and useful knowledge.</p>
            <div className="message-note"><LockKeyhole size={15} aria-hidden="true" /><span>Published by AsaPhis · transcript included</span></div>
            <RouteCTA href="/join" label="Join the Journey" />
            {playbackNote ? <p className="message-playback-note" role="status">{playbackNote}</p> : null}
          </Card>
        </div>
      </section>
      <section className="content-section section-light">
        <div className="site-shell transcript-panel" aria-labelledby="transcript-title">
          <div className="section-heading-row"><div><p className="eyebrow">Transcript</p><h2 id="transcript-title">A message you can return to.</h2></div><span className="status-chip">Published · {formatDate(content.featuredMessage.publishedAt)}</span></div>
          <div className="transcript-copy">{transcript.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
        </div>
      </section>
    </div>
  )
}
