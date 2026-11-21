import type { TrendingStory } from "@/lib/trending-types"

/** Cached legacy briefings can be read immediately without another AI request. */
export function briefingParagraphs(story: Pick<TrendingStory, "summary" | "detail">): string[] {
    const detail = story.detail.trim()
    const paragraphs = detail.split(/\r?\n\s*\r?\n/).map(p=>p.trim()).filter(Boolean)
    if (paragraphs.length === 2) return paragraphs
    if (paragraphs.length === 1 && story.summary.trim() && story.summary.trim() !== detail) {
        return [story.summary.trim(), detail]
    }
    // If an old record duplicates its summary, split at a sentence boundary.
    const sentences = detail.match(/[^.!?]+(?:[.!?]+(?:[”’"']?)(?=\s|$)|$)/g)?.map(s=>s.trim()).filter(Boolean) || []
    if (sentences.length > 1) {
        const middle = Math.ceil(sentences.length / 2)
        return [sentences.slice(0, middle).join(" "), sentences.slice(middle).join(" ")]
    }
    return paragraphs
}
