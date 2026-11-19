import { hasRequiredSources } from "@/lib/trending-core.mjs"
import { getRecord } from "@/lib/platform-store"
import type { TrendingFeed } from "@/lib/trending-types"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const feed = await getRecord<TrendingFeed>("trending", "feed")
        const now = Date.now()
        const stories = (feed?.stories || []).filter(story => hasRequiredSources(story.sources)).sort((a,b) => (Date.parse(b.publishedAt || "") || Date.parse(b.expiresAt)-48*60*60*1000) - (Date.parse(a.publishedAt || "") || Date.parse(a.expiresAt)-48*60*60*1000)).slice(0, 5)
        const recent = feed && stories.every(story => Date.parse(story.expiresAt) > now) && now - Date.parse(feed.generatedAt) < 6 * 60 * 60 * 1000
        return Response.json({ stories, status: stories.length ? (recent ? "ready" : "delayed") : "empty" }, {
            headers: { "Cache-Control": "public, max-age=60, s-maxage=120, stale-if-error=604800" },
        })
    } catch {
        return Response.json({ stories: [], status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } })
    }
}
