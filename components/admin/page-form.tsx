"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Loader2, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ArticleStatus, PageContent } from "@/lib/types"

interface PageFormProps {
    initialData?: PageContent
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

export function PageForm({ initialData, isEditing = false }: PageFormProps) {
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
        status: (initialData?.status || "draft") as ArticleStatus,
    })

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setSaving(true)
        setError("")

        try {
            const response = await fetch(isEditing && initialData ? `/api/pages/${initialData.id}` : "/api/pages", {
                method: isEditing ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...form, slug: form.slug || slugify(form.title) }),
            })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not save this page.")
                return
            }

            router.push("/admin/pages")
            router.refresh()
        } catch {
            setError("Could not save this page. Check your connection and try again.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async () => {
        if (!initialData || !confirm(`Delete "${initialData.title}"?`)) return

        setDeleting(true)

        try {
            const response = await fetch(`/api/pages/${initialData.id}`, { method: "DELETE" })

            if (!response.ok) {
                const data = await response.json().catch(() => ({}))
                setError(data.error || "Could not delete this page.")
                return
            }

            router.push("/admin/pages")
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
                        href="/admin/pages"
                        className="mb-2 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        All pages
                    </Link>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">
                        {isEditing ? "Edit page" : "New page"}
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
                        Save page
                    </Button>
                </div>
            </div>

            {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}

            <Card className="space-y-5 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                            id="title"
                            value={form.title}
                            onChange={(event) =>
                                setForm((current) => ({
                                    ...current,
                                    title: event.target.value,
                                    slug: slugTouched ? current.slug : slugify(event.target.value),
                                }))
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">URL slug</Label>
                        <Input
                            id="slug"
                            value={form.slug}
                            onChange={(event) => {
                                setSlugTouched(true)
                                setForm((current) => ({ ...current, slug: event.target.value }))
                            }}
                            required
                        />
                        <p className="text-xs text-muted-foreground">/{form.slug || "your-page"}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        value={form.status}
                        onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as ArticleStatus }))}
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm sm:max-w-xs"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                    <p className="text-xs text-muted-foreground">Published pages are live at their URL and listed in the footer.</p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="excerpt">Summary</Label>
                    <Textarea
                        id="excerpt"
                        value={form.excerpt}
                        onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
                        rows={2}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="content">Page body</Label>
                    <Textarea
                        id="content"
                        value={form.content}
                        onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                        rows={20}
                        className="font-mono text-sm"
                        placeholder={"## About Tech Hub\n\nWrite the page content here using Markdown."}
                    />
                </div>
            </Card>
        </form>
    )
}
