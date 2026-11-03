"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import { Bookmark, Check } from "lucide-react"
export function ReaderTools({ articleId }: { articleId: string }) {
    const [saved, setSaved] = useState(false)
    const [signedIn, setSignedIn] = useState<boolean | null>(null)
    const [notice, setNotice] = useState("")
    const [busy, setBusy] = useState(false)
    useEffect(() => {
        let active = true
        fetch("/api/reader?state=1").then(async r => { if (r.status === 401) { if (active) setSignedIn(false); return } if (!r.ok) return; const d = await r.json(); if (!active) return; setSignedIn(true); setSaved(d.state.bookmarks.includes(articleId)); if (d.state.historyEnabled) await fetch("/api/reader", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "history", articleId }) }) }).catch(() => {})
        return () => { active = false }
    }, [articleId])
    async function save() {
        setBusy(true)
        try { const r = await fetch("/api/reader", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "bookmark", articleId, saved: !saved }) }); const d = await r.json(); if (!r.ok) throw Error(d.error); setSaved(d.state.bookmarks.includes(articleId)); setNotice(saved ? "Removed from your reading list." : "Saved to your reading list.") } catch (e) { setNotice((e as Error).message) } finally { setBusy(false) }
    }
    return <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">{signedIn === false ? <Link href="/account" className="inline-flex items-center gap-2 rounded-full border px-4 py-2"><Bookmark size={16} aria-hidden="true"/>Sign in to save</Link> : <button type="button" disabled={busy || signedIn === null} aria-pressed={saved} onClick={save} className="inline-flex items-center gap-2 rounded-full border px-4 py-2 hover:bg-muted disabled:opacity-50">{saved ? <Check size={16} aria-hidden="true"/> : <Bookmark size={16} aria-hidden="true"/>}{saved ? "Saved" : "Save for later"}</button>}<span role="status" className="text-muted-foreground">{notice}</span></div>
}
