"use client"
import { useEffect, useRef, useState } from "react"
import { Check, Copy, Instagram, MoreHorizontal, Share2 } from "lucide-react"
import styles from "./article-sharing.module.css"

const paths: Record<string, string> = {
    Facebook: "M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073c0 6.026 4.388 11.02 10.125 11.927v-8.437H7.078v-3.49h3.047V9.413c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.972h-1.513c-1.49 0-1.956.931-1.956 1.887v2.262h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073Z",
    X: "M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.63 7.58H.48l8.6-9.83L0 1.15h7.6l5.24 6.93Zm-1.29 19.5h2.04L6.49 3.24H4.3Z",
    WhatsApp: "M20.52 3.45A11.9 11.9 0 0 0 12.04 0C5.44 0 .07 5.37.07 11.97c0 2.1.55 4.16 1.6 5.97L0 24l6.22-1.63a11.96 11.96 0 0 0 5.82 1.48h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.2-3.5-8.43ZM12.04 21.83a9.9 9.9 0 0 1-5.05-1.38l-.36-.21-3.69.97.98-3.6-.23-.37a9.9 9.9 0 0 1-1.52-5.27c0-5.49 4.46-9.95 9.95-9.95 2.66 0 5.15 1.04 7.03 2.92a9.87 9.87 0 0 1 2.91 7.03c0 5.49-4.46 9.95-10.02 9.86Zm5.46-7.45c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.88-.78-1.48-1.75-1.65-2.05-.18-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.2 5.1 4.49.71.3 1.26.49 1.69.62.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z",
    LinkedIn: "M20.45 20.45H16.9v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.26 2.37 4.26 5.45ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12Zm1.78 13.02H3.56V9h3.56ZM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0Z",
}
function Brand({ name }: { name: string }) {
    if (name === "Reddit") return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><ellipse cx="12" cy="15" rx="9" ry="6"/><circle cx="8" cy="14" r="1" fill="currentColor"/><circle cx="16" cy="14" r="1" fill="currentColor"/><path d="M8 18q4 2 8 0M12 9l2-6 5 1M3.5 12C-1 8 5 6 6 10M20.5 12C25 8 19 6 18 10"/><circle cx="21" cy="4" r="2"/></svg>
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d={paths[name]} /></svg>
}

export function ArticleSharing({ title, url, image }: { title: string; url: string; image?: string }) {
    const [notice, setNotice] = useState("")
    const [copied, setCopied] = useState(false)
    const [native, setNative] = useState(false)
    const details = useRef<HTMLDetailsElement>(null)
    useEffect(() => {
        // Browser capability is unavailable during server rendering.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setNative(typeof navigator.share === "function")
        const outside = (event: PointerEvent) => { if (details.current && !details.current.contains(event.target as Node)) details.current.open = false }
        const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && details.current?.open) { details.current.open = false; details.current.querySelector("summary")?.focus() } }
        document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape)
        return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape) }
    }, [])
    useEffect(() => { if (!copied) return; const timer = setTimeout(() => setCopied(false), 3000); return () => clearTimeout(timer) }, [copied])
    async function copy(instagram = false) {
        try { await navigator.clipboard.writeText(url); setCopied(true); setNotice(instagram ? "Link copied. Paste it into an Instagram message or your bio." : "Link copied.") }
        catch { setNotice(`Copy this link: ${url}`) }
    }
    async function share(instagram = false) {
        if (!navigator.share) { await copy(instagram); return }
        try { await navigator.share({ title, text: title, url }); setNotice("Sharing options opened.") }
        catch (error) { if (!(error instanceof Error && error.name === "AbortError")) await copy(instagram) }
    }
    const enc = encodeURIComponent
    const links = [
        ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
        ["X", `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`],
        ["WhatsApp", `https://wa.me/?text=${enc(`${title} ${url}`)}`],
        ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`],
        ["Reddit", `https://www.reddit.com/submit?url=${enc(url)}&title=${enc(title)}`],
    ]
    let media = ""
    try { if (image) { const resolved = new URL(image, url); if (resolved.protocol === "https:") media = `&media=${enc(resolved.href)}` } } catch { /* Sharing the article still works without an image. */ }
    return <section aria-label="Share this article" className="mt-10 border-t pt-6">
        <h2 className="mb-3 text-lg font-semibold">Share this story</h2>
        <div className={styles.actions}>
            {links.map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={styles.icon} aria-label={`Share on ${name}`} title={name}><Brand name={name} /><span className={styles.tooltip} aria-hidden="true">{name}</span></a>)}
            <button type="button" className={styles.icon} aria-label="Share to Instagram using your device, or copy link" title="Instagram" onClick={() => share(true)}><Instagram aria-hidden="true"/><span className={styles.tooltip} aria-hidden="true">Instagram</span></button>
            <button type="button" className={styles.icon} aria-label={copied ? "Link copied" : "Copy link"} title={copied ? "Copied" : "Copy link"} onClick={() => copy()}>{copied ? <Check aria-hidden="true"/> : <Copy aria-hidden="true"/>}<span className={styles.tooltip} aria-hidden="true">{copied ? "Copied" : "Copy link"}</span></button>
            <details ref={details} className={styles.more} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false }}>
                <summary className={styles.icon} aria-label="More sharing options" title="More"><MoreHorizontal aria-hidden="true"/><span className={styles.tooltip} aria-hidden="true">More</span></summary>
                <div className={styles.menu} onClick={() => { if (details.current) details.current.open = false }}>
                    <a target="_blank" rel="noopener noreferrer" href={`https://www.threads.net/intent/post?text=${enc(`${title} ${url}`)}`}>Threads</a>
                    <a target="_blank" rel="noopener noreferrer" href={`https://pinterest.com/pin/create/button/?url=${enc(url)}&description=${enc(title)}${media}`}>Pinterest</a>
                    {native && <button type="button" onClick={() => share()}><Share2 size={16} aria-hidden="true"/>Share with device</button>}
                </div>
            </details>
        </div>
        <p role="status" className="mt-2 min-h-5 break-all text-sm text-muted-foreground">{notice}</p>
    </section>
}
