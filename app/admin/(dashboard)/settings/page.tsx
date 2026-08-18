"use client"

import { useEffect, useState } from "react"
import { Loader2, Save } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { SiteSettings } from "@/lib/types"

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        fetch("/api/settings")
            .then((response) => response.json())
            .then(setSettings)
            .catch(() => setError("Could not load settings."))
            .finally(() => setLoading(false))
    }, [])

    const save = async () => {
        if (!settings) return

        setSaving(true)
        setError("")
        setMessage("")

        try {
            const response = await fetch("/api/settings", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings),
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not save settings.")
                return
            }

            setMessage("Settings saved.")
            setTimeout(() => setMessage(""), 3000)
        } finally {
            setSaving(false)
        }
    }

    if (loading || !settings) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const field = (key: keyof SiteSettings, label: string, placeholder?: string) => (
        <div className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
                id={key}
                value={settings[key]}
                onChange={(event) => setSettings({ ...settings, [key]: event.target.value })}
                placeholder={placeholder}
            />
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Settings</h1>
                    <p className="text-muted-foreground">Site name, newsletter box, footer, and social links.</p>
                </div>
                <Button onClick={save} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save settings
                </Button>
            </div>

            {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}
            {message && (
                <p className="rounded-md bg-emerald-100 px-3 py-2 text-sm text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                    {message}
                </p>
            )}

            <Card className="space-y-5 p-5">
                <h2 className="font-semibold">Identity</h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    {field("siteName", "Site name")}
                    {field("tagline", "Tagline")}
                </div>
                {field("contactEmail", "Contact email")}
            </Card>

            <Card className="space-y-5 p-5">
                <h2 className="font-semibold">Newsletter box</h2>
                {field("newsletterTitle", "Title")}
                <div className="space-y-2">
                    <Label htmlFor="newsletterText">Description</Label>
                    <Textarea
                        id="newsletterText"
                        value={settings.newsletterText}
                        onChange={(event) => setSettings({ ...settings, newsletterText: event.target.value })}
                        rows={2}
                    />
                </div>
            </Card>

            <Card className="space-y-5 p-5">
                <h2 className="font-semibold">Footer</h2>
                <div className="space-y-2">
                    <Label htmlFor="footerText">Footer description</Label>
                    <Textarea
                        id="footerText"
                        value={settings.footerText}
                        onChange={(event) => setSettings({ ...settings, footerText: event.target.value })}
                        rows={2}
                    />
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                    {field("twitterUrl", "X / Twitter URL", "https://x.com/yourhandle")}
                    {field("linkedinUrl", "LinkedIn URL", "https://linkedin.com/company/...")}
                    {field("youtubeUrl", "YouTube URL", "https://youtube.com/@...")}
                </div>
            </Card>
        </div>
    )
}
