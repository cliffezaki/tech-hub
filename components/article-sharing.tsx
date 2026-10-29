"use client"
import { useState } from "react"

export function ArticleSharing({ title, url, image }: { title: string; url: string; image?: string }) {
    const [notice, setNotice] = useState("")
    const enc = encodeURIComponent
    const links = [
        ["WhatsApp", `https://wa.me/?text=${enc(`${title} ${url}`)}`],
        ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`],
        ["X", `https://twitter.com/intent/tweet?text=${enc(title)}&url=${enc(url)}`],
        ["LinkedIn", `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`],
        ["Threads", `https://www.threads.net/intent/post?text=${enc(`${title} ${url}`)}`],
        ["Pinterest", `https://pinterest.com/pin/create/button/?url=${enc(url)}&description=${enc(title)}${image ? `&media=${enc(new URL(image,url).href)}` : ""}`],
    ]
    const style = "rounded-full border px-4 py-2 text-sm hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2"
    return <section aria-label="Share this article" className="mt-10 border-t pt-6">
        <h2 className="mb-3 text-lg font-semibold">Share this story</h2>
        <div className="flex flex-wrap gap-2">
            {links.slice(0, 4).map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={style} aria-label={`Share on ${name}`}>{name}</a>)}
            <button type="button" className={style} onClick={async () => {
                try { await navigator.clipboard.writeText(url); setNotice("Link copied.") }
                catch { setNotice(`Copy this link: ${url}`) }
            }}>Copy link</button>
            <details><summary className={`${style} cursor-pointer`}>More</summary><div className="mt-2 flex flex-wrap gap-2">
                {links.slice(4).map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={style}>{name}</a>)}
            </div></details>
        </div>
        <p role="status" className="mt-2 break-all text-sm text-muted-foreground">{notice}</p>
    </section>
}
