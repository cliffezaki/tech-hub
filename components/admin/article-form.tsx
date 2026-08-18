"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Star, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ImageField } from "@/components/admin/image-field"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"
import type { Article, ArticleSection, ArticleStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ArticleFormProps {
    initialData?: Article
    isEditing?: boolean
}

function slugify(text: string) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
}

/** `datetime-local` needs `YYYY-MM-DDTHH:mm` in local time, not an ISO string in UTC. */
function toLocalInputValue(iso: string) {
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) {
        return ""
    }

    const offset = date.getTimezoneOffset() * 60000
    return new Date(date.getTime() - offset).toISOString().slice(0, 16)
}

export function ArticleForm({ initialData, isEditing = false }: ArticleFormProps) {
    const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [error, setError] = useState("")
    const [slugTouched, setSlugTouched] = useState(isEditing)

    const [form, setForm] = useState({
        title: initialData?.title || "",
        slug: initialData?.slug || "",
        excerpt: initialData?.excerpt || "",
        content: initialData?.content || "",
        category: initialData?.category || SECTION_META.news.defaultCategory,
        section: (initialData?.section || "news") as ArticleSection,
        author: initialData?.author || "Tech Hub Staff",
        readTime: initialData?.readTime || "",
        publishedAt: toLocalInputValue(initialData?.publishedAt || new Date().toISOString()),
        imageUrl: initialData?.imageUrl || "",
        imageAlt: initialData?.imageAlt || "",
        imageCredit: initialData?.imageCredit || "",
        status: (initialData?.status || "published") as ArticleStatus,
        featured: initialData?.featured || false,
    })

    const update = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
        setForm((current) => ({ ...current, [key]: value }))
    }

    const handleTitleChange = (value: string) => {
        setForm((current) => ({
            ...current,
            title: value,
            slug: slugTouched ? current.slug : slugify(value),
        }))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSaving(true)
        setError("")

        try {
            const payload = {
                ...form,
                slug: form.slug || slugify(form.title),
                publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : new Date().toISOString(),
            }

            const response = await fetch(
                isEditing && initialData ? `/api/articles/${initialData.id}` : "/api/articles",
                {
                    method: isEditing ? "PUT" : "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            )

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not save this article.")
                return
            }

            router.push("/admin/articles")
            router.refresh()
        } catch {
            setError("Could not save this article. Check your connection and try again.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!initialData || !confirm(`Delete "${initialData.title}"? This cannot be undone.`)) return

        setDeleting(true)
        setError("")

        try {
            const response = await fetch(`/api/articles/${initialData.id}`, { method: "DELETE" })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not delete this article.")
                return
            }

            router.push("/admin/articles")
            router.refresh()
        } finally {
            setDeleting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <Link
                        href="/admin/articles"
                        className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        All articles
                    </Link>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">
                        {isEditing ? "Edit article" : "New article"}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {isEditing && (
                        <Button type="button" variant="outline" onClick={handleDelete} disabled={deleting}>
                            {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            Delete
                        </Button>
                    )}
                    <Button type="submit" disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isEditing ? "Save changes" : "Publish article"}
                    </Button>
                </div>
            </div>

            {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-6 lg:col-span-2">
                    <Card className="space-y-5 p-5">
                        <div className="space-y-2">
                            <Label htmlFor="title">Headline</Label>
                            <Input
                                id="title"
                                value={form.title}
                                onChange={(event) => handleTitleChange(event.target.value)}
                                placeholder="Write the headline"
                                required
                                className="text-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="slug">URL slug</Label>
                            <Input
                                id="slug"
                                value={form.slug}
                                onChange={(event) => {
                                    setSlugTouched(true)
                                    update("slug", event.target.value)
                                }}
                                placeholder="url-friendly-headline"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                /{form.section}/{form.slug || "your-slug"}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="excerpt">Excerpt</Label>
                            <Textarea
                                id="excerpt"
                                value={form.excerpt}
                                onChange={(event) => update("excerpt", event.target.value)}
                                rows={3}
                                placeholder="One or two sentences shown on cards and in search results"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Article body</Label>
                            <Textarea
                                id="content"
                                value={form.content}
                                onChange={(event) => update("content", event.target.value)}
                                rows={22}
                                className="font-mono text-sm"
                                placeholder={"## A section heading\n\nWrite your article here.\n\n- Markdown lists work\n- **Bold** and [links](https://example.com) too"}
                            />
                            <p className="text-xs text-muted-foreground">
                                Markdown is supported: ## headings, **bold**, *italic*, - lists, &gt; quotes, and [links](url).
                            </p>
                        </div>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card className="space-y-4 p-5">
                        <h2 className="font-semibold">Publishing</h2>

                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <select
                                id="status"
                                value={form.status}
                                onChange={(event) => update("status", event.target.value as ArticleStatus)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="published">Published</option>
                                <option value="draft">Draft</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={() => update("featured", !form.featured)}
                            className={cn(
                                "flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm transition-colors",
                                form.featured ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : "hover:bg-muted"
                            )}
                        >
                            <Star className={cn("h-4 w-4", form.featured && "fill-amber-400 text-amber-400")} />
                            <span>
                                <span className="block font-medium">Featured</span>
                                <span className="block text-xs text-muted-foreground">Promote this story on the homepage</span>
                            </span>
                        </button>

                        <div className="space-y-2">
                            <Label htmlFor="publishedAt">Publish date</Label>
                            <Input
                                id="publishedAt"
                                type="datetime-local"
                                value={form.publishedAt}
                                onChange={(event) => update("publishedAt", event.target.value)}
                            />
                        </div>
                    </Card>

                    <Card className="space-y-4 p-5">
                        <h2 className="font-semibold">Organisation</h2>

                        <div className="space-y-2">
                            <Label htmlFor="section">Section</Label>
                            <select
                                id="section"
                                value={form.section}
                                onChange={(event) => update("section", event.target.value as ArticleSection)}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                {ARTICLE_SECTIONS.map((section) => (
                                    <option key={section} value={section}>
                                        {SECTION_META[section].label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Category label</Label>
                            <Input
                                id="category"
                                value={form.category}
                                onChange={(event) => update("category", event.target.value)}
                                placeholder="e.g. Artificial Intelligence"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="author">Author</Label>
                            <Input
                                id="author"
                                value={form.author}
                                onChange={(event) => update("author", event.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="readTime">Read time</Label>
                            <Input
                                id="readTime"
                                value={form.readTime}
                                onChange={(event) => update("readTime", event.target.value)}
                                placeholder="Calculated automatically if left empty"
                            />
                        </div>
                    </Card>

                    <Card className="space-y-4 p-5">
                        <ImageField value={form.imageUrl} onChange={(url) => update("imageUrl", url)} />

                        <div className="space-y-2">
                            <Label htmlFor="imageAlt">Image description</Label>
                            <Input
                                id="imageAlt"
                                value={form.imageAlt}
                                onChange={(event) => update("imageAlt", event.target.value)}
                                placeholder="Describes the image for screen readers"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="imageCredit">Image credit</Label>
                            <Input
                                id="imageCredit"
                                value={form.imageCredit}
                                onChange={(event) => update("imageCredit", event.target.value)}
                                placeholder="Photographer or source"
                            />
                        </div>
                    </Card>
                </div>
            </div>
        </form>
    )
}
