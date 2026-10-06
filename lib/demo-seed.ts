import "server-only"
import type { ContentStore } from "@/lib/store/types"
import { estimateReadTime } from "@/lib/store/normalize"
import { coverSvg, diagramSvg } from "@/lib/demo-artwork"
import { DEMO_AUTHOR, DEMO_BATCH, DEMO_STORIES } from "@/lib/demo-content"

export const demoId = (index: number) => `demo-${DEMO_BATCH}-${index}`

export function demoSeedEnabled() {
    if (process.env.VERCEL_ENV === "production") return false
    if (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID)
        return process.env.NEXT_PUBLIC_SANITY_DATASET === "staging" &&
            process.env.VERCEL_ENV === "preview"
    // Isolated local tests only. Never seed the developer's real local content directory.
    return process.env.NODE_ENV !== "production" && !process.env.VERCEL &&
        Boolean(process.env.CMS_TEST_CONTENT_DIR)
}

export async function seedDemoStory(store: ContentStore, index: number, ownerId: string) {
    const story = DEMO_STORIES[index]
    if (!story) throw new Error("Invalid sample article index.")
    const existing = await store.getArticle(demoId(index))
    if (existing) return { article: existing, skipped: true }
    const collision = await store.getArticleBySlug(story.slug)
    if (collision) throw new Error("An existing article uses this sample slug. It has not been changed.")
    const media = await store.listMedia()
    async function asset(filename: string, svg: string) {
        return media.find((item) => item.filename === filename) ||
            await store.uploadMedia({ filename, contentType: "image/svg+xml", data: Buffer.from(svg) })
    }
    const cover = await asset(`${DEMO_BATCH}-${story.slug}.svg`, coverSvg(story.artwork, index, story.category))
    let content = story.content
    if (story.diagram) {
        const diagram = await asset(`${DEMO_BATCH}-diagram-${story.diagram}.svg`, diagramSvg(story.diagram))
        content = content.replace("{{diagram}}", `![${story.diagramAlt}](${diagram.url})\n\n*Original Tech Hub conceptual illustration; not a screenshot.*`)
    }
    content += "\n\n---\n\n*Editorial sample researched on 6 October 2026. Review articles are documentation-based assessments, not hands-on tests. Sources may change after that date. Original Tech Hub illustrations; no third-party news photographs.*"
    const article = await store.createArticle({
        ...story,
        content,
        author: DEMO_AUTHOR,
        ownerId,
        publishedAt: new Date().toISOString(),
        readTime: estimateReadTime(content),
        status: "published",
        featured: story.featured === true,
        manualOrder: index,
        imageUrl: cover.url,
        imageAlt: `Original editorial illustration for ${story.category}: ${story.artwork} motif`,
        imageCredit: "Tech Hub — original editorial illustration",
        demo: true,
        demoBatch: DEMO_BATCH,
    }, demoId(index))
    return { article, skipped: false }
}
