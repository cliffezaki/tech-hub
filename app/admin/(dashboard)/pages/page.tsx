"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Eye, FileText, Loader2, Pencil, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import type { PageContent } from "@/lib/types"

export default function AdminPagesPage() {
    const [pages, setPages] = useState<PageContent[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/pages")
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) setPages(data)
            })
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Pages</h1>
                    <p className="text-muted-foreground">Standalone pages such as About, Advertise, or Privacy.</p>
                </div>
                <Link href="/admin/pages/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New page
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : pages.length === 0 ? (
                <Card className="p-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <h3 className="mt-3 font-semibold">No pages yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add an About page so readers know who is behind Tech Hub.
                    </p>
                </Card>
            ) : (
                <Card className="divide-y">
                    {pages.map((page) => (
                        <div key={page.id} className="flex flex-wrap items-center gap-4 p-4">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <Link href={`/admin/pages/${page.id}`} className="truncate font-medium hover:underline">
                                        {page.title}
                                    </Link>
                                    <span
                                        className={
                                            page.status === "published"
                                                ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                                : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                                        }
                                    >
                                        {page.status}
                                    </span>
                                </div>
                                <p className="mt-1 truncate text-xs text-muted-foreground">
                                    /{page.slug} · updated {formatDate(page.updatedAt)}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                {page.status === "published" && (
                                    <Link href={`/${page.slug}`} target="_blank">
                                        <Button variant="ghost" size="icon" title="View page" aria-label="View page">
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                                <Link href={`/admin/pages/${page.id}`}>
                                    <Button variant="ghost" size="icon" title="Edit" aria-label="Edit">
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    ))}
                </Card>
            )}
        </div>
    )
}
