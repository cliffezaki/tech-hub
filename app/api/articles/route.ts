import { NextResponse } from "next/server"

import { handleError, requireAdmin, requireWritableStore, revalidateSite } from "@/lib/api"
import { getStore } from "@/lib/store"
import { estimateReadTime } from "@/lib/store/normalize"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"
import type { ArticleSection } from "@/lib/types"

export async function GET() {
    try {
        const articles = await getStore().listArticles()
        return NextResponse.json(articles)
    } catch (error) {
        return handleError(error, "Failed to fetch articles")
    }
}

export async function POST(request: Request) {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const body = await request.json()

        if (!body.title?.trim()) {
            return NextResponse.json({ error: "A title is required." }, { status: 400 })
        }

        const section: ArticleSection = ARTICLE_SECTIONS.includes(body.section) ? body.section : "news"

        const article = await getStore().createArticle({
            title: body.title.trim(),
            slug: body.slug || body.title,
            excerpt: body.excerpt || "",
            content: body.content || "",
            category: body.category || SECTION_META[section].defaultCategory,
            section,
            author: body.author || "Tech Hub Staff",
            publishedAt: body.publishedAt || new Date().toISOString(),
            readTime: body.readTime || estimateReadTime(body.content || ""),
            imageUrl: body.imageUrl || undefined,
            imageAlt: body.imageAlt || undefined,
            imageCredit: body.imageCredit || undefined,
            status: body.status === "draft" ? "draft" : "published",
            featured: body.featured === true,
        })

        revalidateSite()
        return NextResponse.json(article, { status: 201 })
    } catch (error) {
        return handleError(error, "Failed to create article")
    }
}
