import { getRecord } from "@/lib/platform-store"
import type { TrendingFeed } from "@/lib/trending-types"

export const dynamic = "force-dynamic"

export async function GET() {
    try {
        const feed = await getRecord<TrendingFeed>("trending", "feed")
        const now = Date.now()
        const stories = (feed?.stories || []).filter(story => Date.parse(story.expiresAt) > now).sort((a,b) => (Date.parse(b.publishedAt || "") || Date.parse(b.expiresAt)-48*60*60*1000) - (Date.parse(a.publishedAt || "") || Date.parse(a.expiresAt)-48*60*60*1000)).slice(0, 7)
        const recent = feed && now - Date.parse(feed.generatedAt) < 6 * 60 * 60 * 1000
        return Response.json({ stories, status: stories.length ? (recent ? "ready" : "delayed") : "empty" }, {
            headers: { "Cache-Control": "public, max-age=60, s-maxage=120" },
        })
    } catch {
        return Response.json({ stories: [], status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } })
    }
}
