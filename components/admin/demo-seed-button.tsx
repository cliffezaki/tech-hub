"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { Article } from "@/lib/types"

export function DemoSeedButton({ onSaved }: { onSaved: (article: Article) => void }) {
    const [plan, setPlan] = useState<{ enabled: boolean; count: number } | null>(null)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState("")
    const [failed, setFailed] = useState(false)
    useEffect(() => {
        fetch("/api/cms/demo").then(async r => {
            if (r.ok) setPlan(await r.json())
        }).catch(() => {})
    }, [])
    if (!plan?.enabled) return null
    async function seed() {
        if (!plan || busy) return
        setBusy(true)
        setFailed(false)
        try {
            for (let index = 0; index < plan.count; index++) {
                setMessage(`Saving sample ${index + 1} of ${plan.count}…`)
                const r = await fetch("/api/cms/demo", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ index }),
                })
                const data = await r.json()
                if (!r.ok) throw new Error(data.error || "Sample import failed.")
                onSaved(data.article)
            }
            setMessage(`${plan.count} researched samples are available in staging. Existing edits were preserved.`)
        } catch (error) {
            setFailed(true)
            setMessage(error instanceof Error ? error.message : "Import failed. You can retry safely.")
        } finally { setBusy(false) }
    }
    return (
        <section className="rounded-lg border bg-muted/30 p-4">
            <h2 className="font-semibold">Staging sample content</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                Add {plan.count} researched articles across all five sections with original illustrations.
                Samples are published in staging only, labelled Demo, and editable here.
                Retrying skips existing samples, including your edits.
            </p>
            <Button type="button" variant="outline" className="mt-3" disabled={busy} onClick={seed}>
                {busy ? "Adding samples…" : "Add researched samples to staging"}
            </Button>
            {message && <p className="mt-3 text-sm" role={failed ? "alert" : "status"} aria-live="polite">{message}</p>}
        </section>
    )
}
