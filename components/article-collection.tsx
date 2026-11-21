"use client"

import { useMemo, useState } from "react"
import { ArticleCard } from "@/components/article-card"
import { Button } from "@/components/ui/button"
import type { ArticleSummary } from "@/lib/types"

export function ArticleCollection({ articles, leadLayout = false }: { articles: ArticleSummary[]; leadLayout?: boolean }) {
    const [category, setCategory] = useState("all")
    const [page, setPage] = useState(1)
    const categories = useMemo(() => [...new Set(articles.map(a => a.category))].sort(), [articles])
    const filtered = articles.filter(a => category === "all" || a.category === category)
    const pages = Math.max(1, Math.ceil(filtered.length / 6))
    const current = Math.min(page, pages)
    const visible = filtered.slice((current - 1) * 6, current * 6)
    const [lead, ...rest] = visible
    const secondary = rest.slice(0, 2)
    const grid = rest.slice(2)
    return (
        <section aria-label="Article collection" className="py-8">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <label className="flex items-center gap-3 text-sm">
                    Category
                    <select className="h-10 max-w-full rounded-md border bg-background px-3"
                        value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}>
                        <option value="all">All categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </label>
                <p className="text-sm text-muted-foreground" aria-live="polite">
                    {filtered.length} {filtered.length === 1 ? "article" : "articles"}
                </p>
            </div>
            {visible.length === 0 ? <p>No articles match this category.</p> :
                leadLayout && current === 1 ? (
                    <>
                        <div className="grid gap-10 lg:grid-cols-12">
                            <div className="lg:col-span-8"><ArticleCard article={lead} variant="feature" priority /></div>
                            {secondary.length > 0 && <div className="flex flex-col gap-8 lg:col-span-4">
                                {secondary.map(a => <ArticleCard key={a.id} article={a} />)}
                            </div>}
                        </div>
                        {grid.length > 0 && <div className="mt-10 grid gap-x-8 gap-y-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-3">
                            {grid.map(a => <ArticleCard key={a.id} article={a} />)}
                        </div>}
                    </>
                ) : <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map(a => <ArticleCard key={a.id} article={a} />)}
                </div>}
            {pages > 1 && <nav aria-label="Article pagination" className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t pt-6">
                <Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button>
                <span className="text-sm" aria-live="polite">Page {current} of {pages}</span>
                <Button variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button>
            </nav>}
        </section>
    )
}
