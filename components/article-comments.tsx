"use client"
import { useEffect, useState } from "react"
export function ArticleComments({ articleId }: { articleId: string }) {
    const [enabled, setEnabled] = useState(false)
    const [comments, setComments] = useState<
        { id: string; name: string; message: string }[]
    >([])
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    useEffect(() => {
        fetch("/api/public/config")
            .then((r) => r.json())
            .then((d) => setEnabled(d.comments))
            .catch(() => {})
        fetch(`/api/public/comments?articleId=${encodeURIComponent(articleId)}`)
            .then((r) => r.json())
            .then((d) => setComments(Array.isArray(d) ? d : []))
            .catch(() => {})
    }, [articleId])
    if (!enabled) return null
    return (
        <section className="mt-12 border-t pt-6">
            <h2 className="text-2xl font-bold">Reader discussion</h2>
            {comments.map((c) => (
                <div key={c.id} className="mt-5 rounded border p-4">
                    <p className="font-semibold">{c.name}</p>
                    <p className="mt-2 whitespace-pre-wrap">{c.message}</p>
                </div>
            ))}
            <form
                className="mt-6"
                onSubmit={async (e) => {
                    e.preventDefault()
                    if (busy) return
                    setBusy(true)
                    const form = e.currentTarget
                    const fields = new FormData(form)
                    const text = fields.get("message")
                    try {
                        const r = await fetch("/api/public/comments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ articleId, message: text, name:fields.get("name"), email:fields.get("email"), websiteTrap:fields.get("websiteTrap") }),
                        })
                        const d = await r.json()
                        setMessage(d.message || d.error)
                        if (r.ok) {
                            form.reset()
                            const response = await fetch(`/api/public/comments?articleId=${encodeURIComponent(articleId)}`, {cache:"no-store"})
                            if (response.ok) setComments(await response.json())
                        }
                    } catch {
                        setMessage("Could not submit your comment. Try again.")
                    } finally {
                        setBusy(false)
                    }
                }}
            >
                <input name="websiteTrap" className="hidden" tabIndex={-1} aria-hidden="true" autoComplete="off" />
                <div className="mb-4 grid gap-4 sm:grid-cols-2"><label>Display name<input name="name" className="cms-input" maxLength={80} required autoComplete="nickname" /></label><label>Email (optional, never displayed)<input name="email" type="email" className="cms-input" maxLength={254} autoComplete="email" /></label></div>
                <label>
                    Your comment
                    <textarea
                        name="message"
                        className="cms-input"
                        rows={4}
                        maxLength={3000}
                        required
                    />
                </label>
                <p className="my-3 text-sm text-muted-foreground">
                    No account needed. Ordinary comments appear immediately; suspicious submissions may need review.
                </p>
                <button className="cms-primary" disabled={busy}>{busy ? "Posting…" : "Post comment"}</button>
                {message && (
                    <p role="status" className="mt-3">
                        {message}
                    </p>
                )}
            </form>
        </section>
    )
}
