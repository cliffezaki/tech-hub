"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowDown, ArrowUp, Eye, FileText, Loader2, Pencil, Plus } from "lucide-react"
import { orderedPages, type MenuLayout } from "@/lib/menu-layout"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import type { PageContent } from "@/lib/types"

export default function AdminPagesPage() {
    const [pages, setPages] = useState<PageContent[]>([])
    const [loading, setLoading] = useState(true)
    const [layout, setLayout] = useState<MenuLayout | null>(null)
    const [moving, setMoving] = useState(false)
    const [message, setMessage] = useState("")

    useEffect(() => {
        fetch("/api/navigation").then(r => r.json()).then(d => { if (d.items) setLayout(d) }).catch(() => setMessage("Could not load ordering controls. Refresh to retry."))
        fetch("/api/pages")
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) setPages(data)
            })
            .catch(() => setMessage("Could not load pages. Refresh to retry."))
            .finally(() => setLoading(false))
    }, [])

    async function move(page: PageContent, direction: number) {
        if (!layout) return
        setMoving(true); setMessage("")
        try {
            const r = await fetch("/api/navigation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"movePage",slug:page.slug,direction,revision:layout.revision})})
            const data = await r.json()
            if (!r.ok) throw new Error(data.error || "Could not reorder pages.")
            setLayout(data); setPages(current => orderedPages(current,data.pageOrder))
            setMessage("Order saved. Published page links now use this order on the website.")
        } catch(e) { setMessage((e as Error).message) } finally { setMoving(false) }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">
                        Pages
                    </h1>
                    <p className="text-muted-foreground">
                        Move pages up or down to reorder their website links. Draft pages remain unpublished.{" "}
                        <Link className="underline" href="/admin/navigation">
                            Control menu visibility and ordering
                        </Link>
                        .
                    </p>
                </div>
                <Link href="/admin/pages/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New page
                    </Button>
                </Link>
            </div>
            {message && <p role="status" className="rounded-lg border bg-background p-4 text-sm">{message}</p>}

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : pages.length === 0 ? (
                <Card className="p-10 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <h3 className="mt-3 font-semibold">No pages yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Add an About page so readers know who is behind Tech
                        Hub.
                    </p>
                </Card>
            ) : (
                <Card className="divide-y">
                    {pages.map((page,index) => (
                        <div
                            key={page.id}
                            className="flex flex-wrap items-center gap-4 p-4"
                        >
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <Link
                                        href={`/admin/pages/${page.id}`}
                                        className="truncate font-medium hover:underline"
                                    >
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
                                    /{page.slug} ·{" "}
                                    {page.updatedAt
                                        ? `updated ${formatDate(page.updatedAt)}`
                                        : "Built-in page — not yet customized"}
                                </p>
                            </div>

                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" disabled={!layout || moving || index === 0} onClick={() => move(page,-1)} aria-label={`Move ${page.title} up`} title="Move up"><ArrowUp className="h-4 w-4" /></Button>
                                <Button variant="ghost" size="icon" disabled={!layout || moving || index === pages.length - 1} onClick={() => move(page,1)} aria-label={`Move ${page.title} down`} title="Move down"><ArrowDown className="h-4 w-4" /></Button>
                                {page.status === "published" && (
                                    <Link
                                        href={`/${page.slug}`}
                                        target="_blank"
                                    >
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            title="View page"
                                            aria-label="View page"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </Link>
                                )}
                                <Link href={`/admin/pages/${page.id}`}>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Edit"
                                        aria-label="Edit"
                                    >
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
