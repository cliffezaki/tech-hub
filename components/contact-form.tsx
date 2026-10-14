"use client"

import { useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ContactForm({ contactEmail }: { contactEmail: string }) {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", websiteTrap: "" })
    const [sent, setSent] = useState(false)
    const [sending, setSending] = useState(false)
    const [error, setError] = useState("")

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        if (sending) return
        setSending(true); setError("")
        try {
            const response = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
            const data = await response.json().catch(() => null)
            if (!response.ok) throw new Error(data?.error || "Your message could not be sent. Please try again.")
            setSent(true)
            setForm({ name: "", email: "", subject: "", message: "", websiteTrap: "" })
        } catch (e) { setError(e instanceof Error ? e.message : "Check your connection and try again.") }
        finally { setSending(false) }
    }

    if (sent) {
        return (
            <div className="mt-6 rounded-lg border border-dashed p-6 text-center" role="status">
                <p className="font-medium">Your message has been sent.</p>
                <p className="mt-1 text-sm text-muted-foreground">Thank you for contacting the Tech Hub team.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
                    Write another message
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div hidden aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.websiteTrap} onChange={e => setForm({ ...form, websiteTrap: e.target.value })} /></label></div>
            {error && <div role="alert" className="rounded-md border border-destructive p-3 text-sm"><p>{error}</p>{contactEmail && <a className="mt-2 inline-block underline" href={`mailto:${contactEmail}`}>Email us directly</a>}</div>}
            <fieldset disabled={sending} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        required
                        autoComplete="name"
                        maxLength={100}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        required
                        autoComplete="email"
                        maxLength={254}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                    id="subject"
                    value={form.subject}
                    onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    placeholder="Story tip, review request, advertising…"
                    maxLength={150}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                    id="message"
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    rows={6}
                    required
                    minLength={10}
                    maxLength={5000}
                />
            </div>

            <Button type="submit" className="w-full" disabled={sending}>
                <Send className="mr-2 h-4 w-4" />
                {sending ? "Sending…" : "Send message"}
            </Button>
            </fieldset>
        </form>
    )
}
