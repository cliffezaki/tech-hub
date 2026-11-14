import type { ArticleSummary } from "@/lib/types"

/** Reserve cards for the feed instead of consuming every story in the header. */
export function newsLayout(articles: ArticleSummary[], category = "all") {
    const filtered = articles.filter(article => category === "all" || article.category === category)
    const hero = category === "all" ? articles[0] : undefined
    const headlines = category === "all" ? articles.slice(1, Math.min(6, Math.max(1, articles.length - 3))) : []
    const used = new Set([hero?.id, ...headlines.map(article => article.id)])
    const remaining = filtered.filter(article => !used.has(article.id))
    // With a single story, show its full card rather than an empty feed.
    const feed = [...(remaining.length ? remaining : filtered)].sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    return { hero, headlines, feed }
}
