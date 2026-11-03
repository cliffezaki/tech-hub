import type { ArticleSummary } from "@/lib/types"

/** Reserve four cards before adding text collections. Each story has one home. */
export function explainerLayout(input: ArticleSummary[]) {
    const seen = new Set<string>()
    const articles = input.filter(a => {
        if (a.section !== "how-stuff-works" || /^how[\s-]*to$/i.test(a.category.trim()) || seen.has(a.id)) return false
        seen.add(a.id)
        return true
    })
    const hero = articles.find(a => a.featured && a.imageUrl) || articles.find(a => a.imageUrl) || articles[0]
    let pool = articles.filter(a => a.id !== hero?.id)
    const topics = [...new Set(articles.map(a => a.category))]
    const explore: ArticleSummary[] = []
    for (const topic of topics) {
        if (pool.length <= 4 || explore.length >= 2) break
        const story = pool.find(a => a.category === topic)
        if (story) { explore.push(story); pool = pool.filter(a => a.id !== story.id) }
    }
    const collections: { topic: string; articles: ArticleSummary[] }[] = []
    for (const topic of topics) {
        const candidates = pool.filter(a => a.category === topic)
        const count = Math.min(3, candidates.length, pool.length - 4)
        if (count < 2 || collections.length >= 2) continue
        const selected = candidates.slice(0, count)
        const ids = new Set(selected.map(a => a.id))
        collections.push({ topic, articles: selected })
        pool = pool.filter(a => !ids.has(a.id))
    }
    return { hero, topics, explore, cards: pool, collections }
}
