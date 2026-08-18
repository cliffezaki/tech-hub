"use client"

import { useMemo, useState } from "react"
import { Search } from "lucide-react"

import { ArticleCard } from "@/components/article-card"
import { Input } from "@/components/ui/input"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"
import type { ArticleSummary, ArticleSection } from "@/lib/types"
import { cn } from "@/lib/utils"

/**
 * The article set is small enough to filter in the browser, which keeps search instant
 * and avoids adding a search service to the deployment.
 */
export function SearchClient({ articles }: { articles: ArticleSummary[] }) {
    const [query, setQuery] = useState("")
    const [section, setSection] = useState<ArticleSection | "all">("all")

    const results = useMemo(() => {
        const term = query.trim().toLowerCase()

        return articles.filter((article) => {
            if (section !== "all" && article.section !== section) return false
            if (!term) return true

            return (
                article.title.toLowerCase().includes(term) ||
                article.excerpt.toLowerCase().includes(term) ||
                article.category.toLowerCase().includes(term) ||
                article.author.toLowerCase().includes(term)
            )
        })
    }, [articles, query, section])

    return (
        <div className="mx-auto mt-10 max-w-5xl">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search headlines, topics, and authors"
                    className="h-14 rounded-full pl-12 text-base"
                    autoFocus
                />
            </div>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
                {(["all", ...ARTICLE_SECTIONS] as const).map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => setSection(option)}
                        className={cn(
                            "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                            section === option
                                ? "border-foreground bg-foreground text-background"
                                : "text-muted-foreground hover:border-foreground hover:text-foreground"
                        )}
                    >
                        {option === "all" ? "Everything" : SECTION_META[option].label}
                    </button>
                ))}
            </div>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                {results.length} result{results.length === 1 ? "" : "s"}
            </p>

            {results.length === 0 ? (
                <p className="py-16 text-center text-muted-foreground">
                    Nothing matched that search. Try a different word.
                </p>
            ) : (
                <div className="mt-8 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                    {results.map((article) => (
                        <ArticleCard key={article.id} article={article} />
                    ))}
                </div>
            )}
        </div>
    )
}
