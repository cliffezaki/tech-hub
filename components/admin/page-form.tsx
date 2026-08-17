'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { PageContent } from "@/lib/types"

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
}

export function PageForm({ initialData, isEditing = false }: PageFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState<Partial<PageContent>>(
        initialData || {
            title: "",
            slug: "",
            status: "draft",
            excerpt: "",
            content: "",
        }
    )

    const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = event.target

        setFormData((current) => ({
            ...current,
            [name]: value,
            ...(name === "title" && !isEditing ? { slug: slugify(value) } : {}),
        }))
    }

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)

        try {
            const url = isEditing && initialData?.id ? `/api/pages/${initialData.id}` : "/api/pages"
            const method = isEditing ? "PUT" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (!response.ok) {
                alert("Something went wrong")
                return
            }

            router.push("/admin/pages")
            router.refresh()
        } catch {
            alert("Failed to save page")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="max-w-3xl space-y-8 rounded-lg border bg-card p-8 shadow-sm">
            <div className="grid gap-2">
                <Label htmlFor="title">Page Title</Label>
                <Input
                    id="title"
                    name="title"
                    value={formData.title || ""}
                    onChange={handleChange}
                    required
                    placeholder="About Tech Hub"
                />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                        id="slug"
                        name="slug"
                        value={formData.slug || ""}
                        onChange={handleChange}
                        required
                        placeholder="about"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status || "draft"}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                    </select>
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                    id="excerpt"
                    name="excerpt"
                    value={formData.excerpt || ""}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Short page summary"
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="content">Page Content</Label>
                <Textarea
                    id="content"
                    name="content"
                    value={formData.content || ""}
                    onChange={handleChange}
                    rows={14}
                    className="font-mono text-sm"
                    placeholder="# Heading\n\nWrite your page content here..."
                />
            </div>

            <div className="flex justify-end gap-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>
                    Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? "Update Page" : "Create Page"}
                </Button>
            </div>
        </form>
    )
}
