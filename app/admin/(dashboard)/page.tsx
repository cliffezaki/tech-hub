"use client"

import { OverviewStats } from "@/components/admin/overview-stats"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { useEffect, useState } from "react"
import Link from "next/link"
import { FileText, Plus, Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { formatDate } from "@/lib/format"
import type { Article, PageContent } from "@/lib/types"

export default function AdminOverviewPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [pages, setPages] = useState<PageContent[]>([])

    useEffect(() => {
        Promise.all([
            fetch("/api/articles").then((response) => response.json()),
            fetch("/api/pages").then((response) => response.json()),
        ])
            .then(([articlesData, pagesData]) => {
                if (Array.isArray(articlesData)) setArticles(articlesData)
                if (Array.isArray(pagesData)) setPages(pagesData)
            })
            .catch((error) => console.error("Failed to load dashboard", error))

    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Overview</h1>
                    <p className="text-muted-foreground">Everything published on Tech Hub, at a glance.</p>
                </div>
                <Link href="/admin/articles/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New article
                    </Button>
                </Link>
            </div>

            <OverviewStats />
            <AnalyticsDashboard />
            <Card className="divide-y">
                <div className="flex items-center justify-between p-4">
                    <h2 className="font-semibold">Recent articles</h2>
                    <Link href="/admin/articles" className="text-sm text-muted-foreground hover:text-foreground">
                        View all
                    </Link>
                </div>

                {articles.length === 0 ? (
                    <div className="p-8 text-center">
                        <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                        <h3 className="mt-3 font-semibold">No articles yet</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Create your first article and it will appear on the site straight away.
                        </p>
                        <Link href="/admin/articles/new" className="mt-4 inline-block">
                            <Button size="sm">
                                <Plus className="mr-2 h-4 w-4" />
                                New article
                            </Button>
                        </Link>
                    </div>
                ) : (
                    articles.slice(0, 6).map((article) => (
                        <Link
                            key={article.id}
                            href={`/admin/articles/${article.id}`}
                            className="flex items-center justify-between gap-4 p-4 transition-colors hover:bg-muted/50"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium">{article.title}</p>
                                <p className="mt-1 truncate text-xs uppercase tracking-wider text-muted-foreground">
                                    {article.section} · {article.category} · {formatDate(article.publishedAt)}
                                </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {article.featured && <Star className="h-4 w-4 fill-amber-400 text-amber-400" />}
                                <span
                                    className={
                                        article.status === "published"
                                            ? "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                            : "rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                                    }
                                >
                                    {article.status}
                                </span>
                            </div>
                        </Link>
                    ))
                )}
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Pages</h2>
                        <Link href="/admin/pages" className="text-sm text-muted-foreground hover:text-foreground">
                            Manage
                        </Link>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        {pages.length === 0
                            ? "No standalone pages yet — add an About or Advertise page."
                            : `${pages.length} page${pages.length === 1 ? "" : "s"}, ${pages.filter((page) => page.status === "published").length} published.`}
                    </p>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold">Homepage</h2>
                        <Link href="/admin/homepage" className="text-sm text-muted-foreground hover:text-foreground">
                            Manage
                        </Link>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Choose the lead story and which articles are featured.
                    </p>
                </Card>
            </div>
        </div>
    )
}
