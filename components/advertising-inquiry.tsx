"use client"
import { useState } from "react"
export function AdvertisingInquiry() {
    const [startedAt] = useState(Date.now)
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    return (
        <form
            className="grid gap-5 rounded-xl border bg-muted/20 p-6 md:grid-cols-2"
            onSubmit={async (e) => {
                e.preventDefault()
                const form = e.currentTarget
                const data = new FormData(form)
                setBusy(true)
                try {
                    const r = await fetch("/api/public/inquiries", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            ...Object.fromEntries(data),
                            consent: data.get("consent") === "on",
                            startedAt,
                        }),
                    })
                    const result = await r.json()
                    if (!r.ok) throw new Error(result.error)
                    setMessage(result.message)
                    form.reset()
                } catch (e) {
                    setMessage((e as Error).message)
                } finally {
                    setBusy(false)
                }
            }}
        >
            {[
                ["name", "Your name", "text", true],
                ["company", "Company / organization", "text", false],
                ["email", "Email", "email", true],
                ["phone", "Phone (optional)", "tel", false],
                ["website", "Website (optional)", "url", false],
                ["format", "Advertising interest", "text", false],
                ["budget", "Estimated budget and currency", "text", false],
                ["start", "Preferred start", "date", false],
                ["end", "Preferred end", "date", false],
                ["audience", "Target audience", "text", false],
            ].map(([name, label, type, required]) => (
                <label key={String(name)}>
                    {label}
                    <input
                        className="cms-input"
                        name={String(name)}
                        type={String(type)}
                        required={Boolean(required)}
                        maxLength={1000}
                    />
                </label>
            ))}
            <label className="md:col-span-2">
                Tell us about your campaign
                <textarea
                    className="cms-input"
                    name="message"
                    rows={5}
                    required
                    maxLength={6000}
                />
            </label>
            <div className="hidden" aria-hidden="true">
                <input name="websiteTrap" tabIndex={-1} autoComplete="off" />
            </div>
            <label className="md:col-span-2">
                <input
                    type="checkbox"
                    name="consent"
                    required
                    className="mr-2"
                />
                I agree that Tech Hub may store these details and contact me
                about this inquiry.
            </label>
            <div className="md:col-span-2">
                <button className="cms-primary" disabled={busy}>
                    {busy ? "Submitting…" : "Send advertising inquiry"}
                </button>
                {message && (
                    <p className="mt-4" role="status">
                        {message}
                    </p>
                )}
            </div>
        </form>
    )
}
