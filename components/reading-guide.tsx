"use client"
import { useEffect, useState } from "react"
export function ReadingGuide() {
    const [headings, setHeadings] = useState<{ id: string; text: string }[]>([])
    const [progress, setProgress] = useState(0)
    useEffect(() => {
        const content = document.getElementById("article-content")
        if (!content) return
        const entries = Array.from(content.querySelectorAll("h2, h3")).map((heading, i) => { if (!heading.id) heading.id = `story-section-${i + 1}`; return { id: heading.id, text: heading.textContent || "" } })
        // The contents list is derived from rendered Markdown headings after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if ((content.textContent || "").split(/\s+/).length >= 600 && entries.length >= 3) setHeadings(entries)
        let frame = 0
        const update = () => { frame = 0; const bounds = content.getBoundingClientRect(); setProgress(Math.max(0, Math.min(100, (window.innerHeight - bounds.top) / bounds.height * 100))) }
        const scroll = () => { if (!frame) frame = requestAnimationFrame(update) }
        update(); window.addEventListener("scroll", scroll, { passive: true }); window.addEventListener("resize", scroll)
        return () => { cancelAnimationFrame(frame); window.removeEventListener("scroll", scroll); window.removeEventListener("resize", scroll) }
    }, [])
    return <><div aria-hidden="true" className="pointer-events-none fixed inset-x-0 bottom-0 z-40 h-0.5 bg-transparent"><div className="h-full origin-left bg-brand-solid" style={{ transform: `scaleX(${progress / 100})` }} /></div>{headings.length > 0 && <details className="mb-8 rounded-xl border p-5"><summary className="cursor-pointer font-semibold">In this article</summary><nav aria-label="Article contents" className="mt-4"><ol className="space-y-3 text-sm">{headings.map(h => <li key={h.id}><a href={`#${h.id}`} className="underline underline-offset-4">{h.text}</a></li>)}</ol></nav></details>}</>
}
