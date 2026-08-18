"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Eye, Loader2, Pencil, Plus, Search, Star, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { formatDate } from "@/lib/format"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"
import type { Article, ArticleSection } from "@/lib/types"
import { cn } from "@/lib/utils"

type SectionFilter = ArticleSection | "all"
type StatusFilter = "all" | "published" | "draft"

export default function AdminArticlesPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [section, setSection] = useState<SectionFilter>("all")
    const [status, setStatus] = useState<StatusFilter>("all")
    const [busyId, setBusyId] = useState<string | null>(null)
    const [error, setError] = useState("")

    useEffect(() => {
        fetch("/api/articles")
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) setArticles(data)
            })
            .catch(() => setError("Could not load articles."))
            .finally(() => setLoading(false))
    }, [])

    const visible = useMemo(() => {
        const term = search.trim().toLowerCase()

        return articles.filter((article) => {
            if (section !== "all" && article.section !== section) return false
            if (status !== "all" && article.status !== status) return false
            if (!term) return true

            return (
                article.title.toLowerCase().includes(term) ||
                article.category.toLowerCase().includes(term) ||
                article.author.toLowerCase().includes(term)
            )
        })
    }, [articles, search, section, status])

    const handleDelete = async (article: Article) => {
        if (!confirm(`Delete "${article.title}"? This cannot be undone.`)) return

        setBusyId(article.id)
        setError("")

        try {
            const response = await fetch(`/api/articles/${article.id}`, { method: "DELETE" })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not delete that article.")
                return
            }

            setArticles((current) => current.filter((item) => item.id !== article.id))
        } finally {
            setBusyId(null)
        }
    }

    const toggleFeatured = async (article: Article) => {
        setBusyId(article.id)
        setError("")

        try {
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
        } finally {
            setBusyId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Articles</h1>
                    <p className="text-muted-foreground">Create, edit, feature, and remove stories.</p>
                </div>
                <Link href="/admin/articles/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New article
                    </Button>
                </Link>
            </div>

            <Card className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search by title, category, or author"
                            className="pl-9"
                        />
                    </div>

                    <select
                        value={section}
                        onChange={(event) => setSection(event.target.value as SectionFilter)}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        aria-label="Filter by section"
                    >
                        <option value="all">All sections</option>
                        {ARTICLE_SECTIONS.map((item) => (
                            <option key={item} value={item}>
                                {SECTION_META[item].label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={status}
                        onChange={(event) => setStatus(event.target.value as StatusFilter)}
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                        aria-label="Filter by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Drafts</option>
                    </select>
                </div>
            </Card>

            {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : visible.length === 0 ? (
                <Card className="p-10 text-center">
                    <h3 className="font-semibold">No articles match those filters</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {articles.length === 0 ? "Create your first article to get started." : "Try clearing the search or filters."}
                    </p>
                </Card>
            ) : (
                <Card className="divide-y">
                    {visible.map((article) => (
                        <div key={article.id} className="flex flex-wrap items-center gap-4 p-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/articles/${article.id}`}
                                        className="truncate font-medium hover:underline"
                                    >
                                        {article.title}
                                    </Link>
                                    {article.status === "draft" && (
                                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                                            Draft
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 truncate text-xs uppercase tracking-wider text-muted-foreground">
                                    {SECTION_META[article.section].label} · {article.category} · {article.author} ·{" "}
                                    {formatDate(article.publishedAt)}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title={article.featured ? "Remove from featured" : "Mark as featured"}
                                    aria-label={article.featured ? "Remove from featured" : "Mark as featured"}
                                    disabled={busyId === article.id}
                                    onClick={() => toggleFeatured(article)}
                                >
                                    <Star
                                        className={cn(
                                            "h-4 w-4",
                                            article.featured ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                                        )}
                                    />
                                </Button>

                                {article.status === "published" && (
                                    <Link href={`/${article.section}/${article.slug}`} target="_blank">
                                        <Button variant="ghost" size="icon" title="View on site" aria-label="View on site">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}

                                <Link href={`/admin/articles/${article.id}`}>
                                    <Button variant="ghost" size="icon" title="Edit" aria-label="Edit">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </Link>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    title="Delete"
                                    aria-label="Delete"
                                    disabled={busyId === article.id}
                                    onClick={() => handleDelete(article)}
                                >
                                    {busyId === article.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))}
                </Card>
            )}
        </div>
    )
}
