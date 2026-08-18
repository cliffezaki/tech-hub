import { NextResponse } from "next/server"

import { handleError, requireAdmin, requireWritableStore, revalidateSite } from "@/lib/api"
import { getStore } from "@/lib/store"
import { estimateReadTime } from "@/lib/store/normalize"
import { ARTICLE_SECTIONS } from "@/lib/types"
import type { Article } from "@/lib/types"

interface Props {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
    try {
        const { id } = await params
        const article = await getStore().getArticle(id)

        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 })
        }

        return NextResponse.json(article)
    } catch (error) {
        return handleError(error, "Failed to fetch article")
    }
}

export async function PUT(request: Request, { params }: Props) {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const { id } = await params
        const body = await request.json()

        const patch: Partial<Article> = {}
        if (body.title !== undefined) patch.title = String(body.title).trim()
        if (body.slug !== undefined) patch.slug = body.slug
        if (body.excerpt !== undefined) patch.excerpt = body.excerpt
        if (body.content !== undefined) patch.content = body.content
        if (body.category !== undefined) patch.category = body.category
        if (body.section !== undefined && ARTICLE_SECTIONS.includes(body.section)) patch.section = body.section
        if (body.author !== undefined) patch.author = body.author
        if (body.publishedAt !== undefined) patch.publishedAt = body.publishedAt
        if (body.imageUrl !== undefined) patch.imageUrl = body.imageUrl || undefined
        if (body.imageAlt !== undefined) patch.imageAlt = body.imageAlt || undefined
        if (body.imageCredit !== undefined) patch.imageCredit = body.imageCredit || undefined
        if (body.status !== undefined) patch.status = body.status === "draft" ? "draft" : "published"
        if (body.featured !== undefined) patch.featured = body.featured === true

        // An empty read time means "recalculate from the body" rather than "blank it".
        if (body.readTime) {
            patch.readTime = body.readTime
        } else if (body.content !== undefined) {
            patch.readTime = estimateReadTime(body.content)
        }

        const updated = await getStore().updateArticle(id, patch)

        if (!updated) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 })
        }

        revalidateSite()
        return NextResponse.json(updated)
    } catch (error) {
        return handleError(error, "Failed to update article")
    }
}

export async function DELETE(request: Request, { params }: Props) {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const { id } = await params
        const deleted = await getStore().deleteArticle(id)

        if (!deleted) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 })
        }

        revalidateSite()
        return NextResponse.json({ message: "Deleted successfully" })
    } catch (error) {
        return handleError(error, "Failed to delete article")
    }
}
