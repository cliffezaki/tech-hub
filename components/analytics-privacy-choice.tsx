"use client"
import { useEffect, useState } from "react"
export function AnalyticsPrivacyChoice() {
    const [excluded, setExcluded] = useState(false)
    const [ready, setReady] = useState(false)
    const [error, setError] = useState("")
    useEffect(() => {
        try {
            setExcluded(localStorage.getItem("techhub-analytics-opt-out") === "true" || localStorage.getItem("techhub-consent") === "declined")
            setReady(true)
        } catch { setError("Browser storage is unavailable. Use Do Not Track or Global Privacy Control to exclude measurements.") }
    }, [])
    return <section className="space-y-3 rounded-xl border p-5">
        <h2 className="font-semibold">Your analytics preference</h2>
        <label className="flex items-center gap-3">
            <input type="checkbox" disabled={!ready} checked={excluded} onChange={event => {
                const value = event.target.checked
                try {
                    localStorage.setItem("techhub-analytics-opt-out", String(value))
                    localStorage.removeItem("techhub-consent")
                    localStorage.removeItem("techhub-visitor")
                    setExcluded(value)
                } catch { setError("Could not save your preference. Use your browser privacy settings instead.") }
            }} />
            Exclude this browser from anonymous analytics
        </label>
        {ready && <p role="status" className="text-sm">{excluded ? "Measurements are excluded for this browser." : "Anonymous measurements are enabled unless your browser sends a privacy opt-out signal."}</p>}
        {error && <p role="alert">{error}</p>}
    </section>
}
