"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { SafeImage } from "@/components/safe-image"
import { formatDate } from "@/lib/format"
import { SECTION_META } from "@/lib/types"
import type { Article, SiteSettings } from "@/lib/types"
import { cn } from "@/lib/utils"

export default function AdminHomepagePage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [settings, setSettings] = useState<SiteSettings | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState("")
    const [error, setError] = useState("")

    useEffect(() => {
        Promise.all([
            fetch("/api/articles").then((response) => response.json()),
            fetch("/api/settings").then((response) => response.json()),
        ])
            .then(([articlesData, settingsData]) => {
                if (Array.isArray(articlesData)) setArticles(articlesData)
                if (settingsData && typeof settingsData === "object") setSettings(settingsData)
            })
            .catch(() => setError("Could not load homepage settings."))
            .finally(() => setLoading(false))
    }, [])

    const published = articles.filter((article) => article.status === "published")
    const featured = published.filter((article) => article.featured)

    const toggleFeatured = async (article: Article) => {
        const response = await fetch(`/api/articles/${article.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ featured: !article.featured }),
        })

        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            setError(data.error || "Could not update that article.")
            return
        }

        const updated: Article = await response.json()
        setArticles((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    }

    const saveSettings = async () => {
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

            setMessage("Homepage updated.")
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

    const leadArticle = settings.heroArticleId
        ? published.find((article) => article.id === settings.heroArticleId)
        : featured[0] || published[0]

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Homepage</h1>
                    <p className="text-muted-foreground">Pick the lead story and the articles that get promoted.</p>
                </div>
                <Button onClick={saveSettings} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save homepage
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
                <div>
                    <h2 className="font-semibold">Lead story</h2>
                    <p className="text-sm text-muted-foreground">
                        Pin one article to the top of the homepage, or leave it automatic to use the newest featured story.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="heroArticleId">Pinned article</Label>
                    <select
                        id="heroArticleId"
                        value={settings.heroArticleId}
                        onChange={(event) => setSettings({ ...settings, heroArticleId: event.target.value })}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    >
                        <option value="">Automatic — newest featured article</option>
                        {published.map((article) => (
                            <option key={article.id} value={article.id}>
                                {article.title}
                            </option>
                        ))}
                    </select>
                </div>

                {leadArticle && (
                    <div className="flex gap-4 rounded-lg border bg-muted/30 p-3">
                        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded bg-muted">
                            {leadArticle.imageUrl && (
                                <SafeImage src={leadArticle.imageUrl} alt={leadArticle.title} fill className="object-cover" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">Currently leading</p>
                            <p className="truncate font-medium">{leadArticle.title}</p>
                            <p className="text-xs text-muted-foreground">
                                {SECTION_META[leadArticle.section].label} · {formatDate(leadArticle.publishedAt)}
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="heroEyebrow">Hero label</Label>
                        <Input
                            id="heroEyebrow"
                            value={settings.heroEyebrow}
                            onChange={(event) => setSettings({ ...settings, heroEyebrow: event.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="heroTitle">Headline override</Label>
                        <Input
                            id="heroTitle"
                            value={settings.heroTitle}
                            onChange={(event) => setSettings({ ...settings, heroTitle: event.target.value })}
                            placeholder="Leave empty to use the article headline"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="heroSubtitle">Summary override</Label>
                    <Textarea
                        id="heroSubtitle"
                        value={settings.heroSubtitle}
                        onChange={(event) => setSettings({ ...settings, heroSubtitle: event.target.value })}
                        rows={2}
                        placeholder="Leave empty to use the article excerpt"
                    />
                </div>
            </Card>

            <Card className="p-5">
                <div className="mb-4">
                    <h2 className="font-semibold">Featured articles</h2>
                    <p className="text-sm text-muted-foreground">
                        {featured.length === 0
                            ? "Nothing featured yet — the homepage will fall back to the newest stories."
                            : `${featured.length} article${featured.length === 1 ? "" : "s"} promoted on the homepage.`}
                    </p>
                </div>

                <div className="divide-y">
                    {published.map((article) => (
                        <div key={article.id} className="flex items-center gap-3 py-2">
                            <button
                                type="button"
                                onClick={() => toggleFeatured(article)}
                                className="shrink-0 rounded p-1.5 transition-colors hover:bg-muted"
                                aria-label={article.featured ? "Remove from featured" : "Mark as featured"}
                            >
                                <Star
                                    className={cn(
                                        "h-4 w-4",
                                        article.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                                    )}
                                />
                            </button>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{article.title}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {SECTION_META[article.section].label} · {formatDate(article.publishedAt)}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    )
}
