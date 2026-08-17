'use client'

import { useEffect, useState } from "react"
import Link from "next/link"
import { Edit, FileText, Loader2, Plus, Trash } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { PageContent } from "@/lib/types"

export default function AdminPagesPage() {
    const [pages, setPages] = useState<PageContent[]>([])
    const [loading, setLoading] = useState(true)

    const fetchPages = async () => {
        try {
            const response = await fetch("/api/pages")
            const data = await response.json()

            if (Array.isArray(data)) {
                setPages(data)
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchPages()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this page?")) {
            return
        }

        await fetch(`/api/pages/${id}`, { method: "DELETE" })
        fetchPages()
    }

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-5xl px-4 py-12">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Pages</h1>
                    <p className="text-muted-foreground">Manage static pages like About, Advertise, and policy pages.</p>
                </div>
                <Link href="/admin/pages/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Page
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {pages.length === 0 ? (
                    <Card className="border-dashed bg-muted/50 py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="h-10 w-10 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold">No pages yet</h3>
                            <p className="text-muted-foreground">Create your first page to get started.</p>
                        </div>
                    </Card>
                ) : (
                    pages.map((page) => (
                        <Card key={page.id} className="flex items-center justify-between p-4">
                            <div className="flex-1">
                                <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold">{page.title}</h3>
                                <div className="mt-1 flex gap-3 text-xs uppercase tracking-wider text-muted-foreground">
                                    <span>{page.status}</span>
                                    <span>/</span>
                                    <span>/{page.slug}</span>
                                    <span>/</span>
                                    <span>{new Date(page.updatedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/admin/pages/edit/${page.id}`}>
                                    <Button variant="outline" size="sm">
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit
                                    </Button>
                                </Link>
                                <Button variant="destructive" size="sm" onClick={() => handleDelete(page.id)}>
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
