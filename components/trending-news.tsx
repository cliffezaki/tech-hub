"use client"

import { useEffect, useRef, useState } from "react"
import type { TrendingStory } from "@/lib/trending-types"
import styles from "./trending-news.module.css"

export function TrendingNews() {
    const [stories, setStories] = useState<TrendingStory[]>([])
    const [status, setStatus] = useState("loading")
    const [selected, setSelected] = useState<TrendingStory | null>(null)
    const dialog = useRef<HTMLDialogElement>(null)
    const opener = useRef<HTMLButtonElement | null>(null)

    useEffect(() => {
        const controller = new AbortController()
        async function refresh() {
            try {
                const response = await fetch("/api/trending", { signal: controller.signal })
                if (!response.ok) throw new Error("Unavailable")
                const feed = await response.json()
                setStories(feed.stories)
                setStatus(feed.status)
            } catch {
                if (!controller.signal.aborted) {
                    setStories(current => current.filter(s => Date.parse(s.expiresAt) > Date.now()))
                    setStatus("unavailable")
                }
            }
        }
        void refresh()
        // Reads cached results only; visitors never trigger AI generation.
        const timer = setInterval(refresh, 5 * 60 * 1000)
        return () => { controller.abort(); clearInterval(timer) }
    }, [])

    useEffect(() => {
        const element = dialog.current
        if (!selected || !element) return
        element.showModal()
        const overflow = document.body.style.overflow
        document.body.style.overflow = "hidden"
        return () => {
            element.close()
            document.body.style.overflow = overflow
            opener.current?.focus({ preventScroll: true })
        }
    }, [selected])

    return <section className={styles.feed} aria-labelledby="trending-heading">
        <header className={styles.header}>
            <h2 id="trending-heading">Trending Now</h2>
            <span className={styles.indicator}><span aria-hidden="true" />Tech briefing</span>
        </header>
        <p className={styles.disclosure}>News summaries · Linked to original reporting</p>
        {stories.length ? <ol className={styles.list}>
            {stories.map(story => <li key={story.id}>
                <button className={styles.story} aria-haspopup="dialog" onClick={event => {
                    opener.current = event.currentTarget
                    setSelected(story)
                }}>
                    <h3>{story.headline}</h3>
                    <p>{story.summary}</p>
                    <span className={styles.more}>Read the briefing <span aria-hidden="true">↗</span></span>
                </button>
            </li>)}
        </ol> : <p className={styles.empty} role="status">{status === "loading" ? "Loading tech updates…" : "Fresh briefings are not available right now. Please check back soon."}</p>}
        {!!stories.length && <p className={styles.footer}>{status === "ready" ? "Updated automatically" : "Showing recent briefings · Updates temporarily delayed"}</p>}
        <dialog ref={dialog} className={styles.dialog} aria-labelledby="briefing-title" onCancel={() => setSelected(null)} onClose={() => setSelected(null)} onClick={event => {
            if (event.target === event.currentTarget) {
                const box = event.currentTarget.getBoundingClientRect()
                if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) setSelected(null)
            }
        }}>
            {selected && <div className={styles.panel}>
                <header className={styles.panelHeader}><span>MY TECH HUB / TECH BRIEFING</span><button autoFocus className={styles.close} onClick={() => setSelected(null)} aria-label="Close news preview">×</button></header>
                <h2 id="briefing-title">{selected.headline}</h2>
                <p className={styles.disclosure}>AI-generated summary of linked reporting</p>
                <p className={styles.detail}>{selected.detail}</p>
                <h3 className={styles.subheading}>Why it matters</h3>
                <p className={styles.detail}>{selected.whyItMatters}</p>
                <h3 className={styles.subheading}>Read the original reporting</h3>
                <ul className={styles.sources}>{selected.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.name}<span aria-hidden="true"> ↗</span><span className="sr-only"> (opens in a new tab)</span></a></li>)}</ul>
                <p className={styles.note}>This briefing is automatically prepared from the sources above. Refer to their reporting for full detail and subsequent corrections.</p>
                <button className={styles.back} onClick={() => setSelected(null)}>Back to reading</button>
            </div>}
        </dialog>
    </section>
}
