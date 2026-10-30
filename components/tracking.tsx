"use client"
import { useEffect, useRef } from "react"
import { browserReference, BROWSER_KEY } from "@/lib/browser-measurement"
import { usePathname } from "next/navigation"

let configuration: Promise<boolean> | undefined
function analyticsEnabled() {
    return configuration ??= fetch("/api/public/config", { cache: "no-store" })
        .then(async (response) => response.ok && (await response.json()).analytics === true)
        .catch(() => { configuration = undefined; return false })
}
function optedOut() {
    try {
        return localStorage.getItem("techhub-analytics-opt-out") === "true" ||
            localStorage.getItem("techhub-consent") === "declined"
    } catch { return false }
}
export async function track(kind: string, extra: Record<string, string> = {}) {
    const pathname = location.pathname
    if (/^\/(admin|account|api)(\/|$)/.test(pathname)) return
    if (optedOut() || navigator.doNotTrack === "1" ||
        (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl) return
    if (!(await analyticsEnabled()) || optedOut()) return
    let browserId: string | undefined
    try { browserId = browserReference(localStorage) } catch { /* retain page-view counting without storage */ }
    let referrer = ""
    try { referrer = new URL(document.referrer).hostname } catch { /* direct visit */ }
    void fetch("/api/public/event", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        referrerPolicy: "no-referrer",
        keepalive: true,
        body: JSON.stringify({
            mode: "anonymous",
            kind,
            browserId,
            path: pathname,
            referrer,
            eventId: crypto.randomUUID(),
            campaign: extra.campaign,
            placement: extra.placement,
        }),
    }).catch(() => {})
}
// Retain this export so existing layouts do not need to change.
export function TrackingConsent() {
    const path = usePathname()
    const lastPath = useRef<string | null>(null)
    useEffect(() => {
        try {
            // Remove the old tracking identifier, including for readers who opted out.
            localStorage.removeItem("techhub-visitor")
            if (optedOut() || navigator.doNotTrack === "1" || (navigator as Navigator & {globalPrivacyControl?:boolean}).globalPrivacyControl) localStorage.removeItem(BROWSER_KEY)
        } catch { /* analytics also works when browser storage is blocked */ }
        if (lastPath.current !== path && !/^\/(admin|account|api)(\/|$)/.test(path)) {
            lastPath.current = path
            void track("view")
        }
    }, [path])
    return null
}
