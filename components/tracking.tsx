"use client"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
export function track(kind: string, extra: Record<string, string> = {}) {
    if (localStorage.getItem("techhub-consent") !== "accepted") return
    let visitor = localStorage.getItem("techhub-visitor")
    if (!visitor) {
        visitor = crypto.randomUUID()
        localStorage.setItem("techhub-visitor", visitor)
    }
    void fetch("/api/public/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
            kind,
            visitor,
            consent: true,
            path: location.pathname,
            referrer: document.referrer,
            eventId: crypto.randomUUID(),
            ...extra,
        }),
    }).catch(() => {})
}
export function TrackingConsent() {
    const path = usePathname()
    const [enabled, setEnabled] = useState(false)
    const [choice, setChoice] = useState<string | null>("loading")
    useEffect(() => {
        fetch("/api/public/config")
            .then((r) => r.json())
            .then((d) => {
                setEnabled(d.analytics === true)
                setChoice(localStorage.getItem("techhub-consent"))
            })
            .catch(() => {})
    }, [])
    useEffect(() => {
        if (enabled && choice === "accepted" && path !== "/account")
            track("view")
    }, [path, enabled, choice])
    if (!enabled) return null
    function choose(value: string) {
        localStorage.setItem("techhub-consent", value)
        if (value !== "accepted") localStorage.removeItem("techhub-visitor")
        setChoice(value)
        window.dispatchEvent(new Event("techhub-consent"))
    }
    return !choice ? (
        <aside className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-2xl rounded-xl border bg-background p-5 shadow-xl">
            <h2 className="font-semibold">
                Help us understand what readers enjoy
            </h2>
            <p className="my-3 text-sm">
                Optional first-party analytics record page visits, device
                information and ad interactions using a random browser
                identifier. We do not collect age, gender, or precise location.
            </p>
            <div className="flex gap-5">
                <button
                    className="cms-primary"
                    onClick={() => choose("accepted")}
                >
                    Allow analytics
                </button>
                <button onClick={() => choose("declined")}>Decline</button>
            </div>
        </aside>
    ) : (
        <button
            className="fixed bottom-2 right-2 z-30 rounded border bg-background px-3 py-1 text-xs"
            onClick={() => {
                choose("declined")
                setChoice(null)
            }}
        >
            Privacy choices
        </button>
    )
}
