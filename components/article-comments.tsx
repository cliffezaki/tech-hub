"use client"
import { useEffect, useState } from "react"
export function ArticleComments({ articleId }: { articleId: string }) {
    const [enabled, setEnabled] = useState(false)
    const [comments, setComments] = useState<
        { id: string; name: string; message: string }[]
    >([])
    const [message, setMessage] = useState("")
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
                    const form = e.currentTarget
                    const text = new FormData(form).get("message")
                    try {
                        const r = await fetch("/api/public/comments", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ articleId, message: text }),
                        })
                        const d = await r.json()
                        setMessage(d.message || d.error)
                        if (r.ok) form.reset()
                    } catch {
                        setMessage("Could not submit your comment. Try again.")
                    }
                }}
            >
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
                    Sign in to comment. All comments are reviewed before
                    publication.
                </p>
                <button className="cms-primary">Submit for review</button>
                {message && (
                    <p role="status" className="mt-3">
                        {message}
                    </p>
                )}
            </form>
        </section>
    )
}
