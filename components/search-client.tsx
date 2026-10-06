"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { ArticleCard } from "@/components/article-card"
import { Input } from "@/components/ui/input"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"
import type { ArticleSummary, ArticleSection } from "@/lib/types"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

/**
 * The article set is small enough to filter in the browser, which keeps search instant
 * and avoids adding a search service to the deployment.
 */
export function SearchClient({ articles }: { articles: ArticleSummary[] }) {
    const [query, setQuery] = useState("")
    const [section, setSection] = useState<ArticleSection | "all">("all")
    const [category, setCategory] = useState("all")
    const [page, setPage] = useState(1)
    const categories = useMemo(() => [...new Set(articles.map(a => a.category))].sort(), [articles])

    const results = useMemo(() => {
        const term = query.trim().toLowerCase()

        return articles.filter((article) => {
            if (section !== "all" && article.section !== section) return false
            if (category !== "all" && article.category !== category) return false
            if (!term) return true

            return (
                article.title.toLowerCase().includes(term) ||
                article.excerpt.toLowerCase().includes(term) ||
                article.category.toLowerCase().includes(term) ||
                article.author.toLowerCase().includes(term)
            )
        })
    }, [articles, query, section, category])
    const pages = Math.max(1, Math.ceil(results.length / 6))
    const current = Math.min(page, pages)
    const visible = results.slice((current - 1) * 6, current * 6)

    return (
        <div className="mx-auto mt-10 max-w-5xl">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); setPage(1) }}
                    placeholder="Search headlines, topics, and authors"
                    className="h-14 rounded-full pl-12 text-base"
                    autoFocus
                    aria-label="Search headlines, topics, and authors"
                />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {(["all", ...ARTICLE_SECTIONS] as const).map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => { setSection(option); setPage(1) }}
                        className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                            section === option
                                ? "border-foreground bg-foreground text-background"
                                : "text-muted-foreground hover:border-foreground hover:text-foreground"
                        )}
                        aria-pressed={section === option}
                    >
                        {option === "all" ? "Everything" : SECTION_META[option].label}
                    </button>
                ))}
            </div>
            <label className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
                Category
                <select value={category} onChange={e => { setCategory(e.target.value); setPage(1) }}
                    className="h-10 rounded-md border bg-background px-3">
                    <option value="all">All categories</option>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </label>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                {results.length} result{results.length === 1 ? "" : "s"}
            </p>

            {results.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">
                    Nothing matched that search. Try a different word.
                </p>
            ) : (
                <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            )}
            {pages > 1 && <nav aria-label="Search pagination" className="mt-10 flex flex-wrap items-center justify-center gap-4 border-t pt-6">
                <Button variant="outline" disabled={current === 1} onClick={() => setPage(current - 1)}>Previous</Button>
                <span className="text-sm" aria-live="polite">Page {current} of {pages}</span>
                <Button variant="outline" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</Button>
            </nav>}
        </div>
    )
}
