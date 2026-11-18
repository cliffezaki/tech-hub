import type { ArticleSummary } from "@/lib/types"

/** Reserve cards for the feed instead of consuming every story in the header. */
export function newsLayout(articles: ArticleSummary[], category = "all") {
    const filtered = articles.filter(article => category === "all" || article.category === category)
    const hero = category === "all" ? articles.find(a=>a.pinnedAreas?.includes("news:featured")) || articles.find(a=>!a.pinnedAreas?.includes("news:latest")) : undefined
    const headlines = category === "all" ? articles.filter(a=>a.id!==hero?.id && !a.pinnedAreas?.includes("news:latest")).slice(0, Math.min(6, Math.max(0, articles.length - 5))) : []
    const used = new Set([hero?.id, ...headlines.map(article => article.id)])
    const remaining = filtered.filter(article => !used.has(article.id))
    // With a single story, show its full card rather than an empty feed.
    const feed = articles.length === 1 ? filtered : remaining
    return { hero, headlines, feed }
}
