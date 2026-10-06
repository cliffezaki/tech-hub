import { NextResponse } from "next/server"

import {
    handleError,
    requireAdmin,
    requireWritableStore,
    revalidateSite,
} from "@/lib/api"
import { getStore } from "@/lib/store"
import { estimateReadTime } from "@/lib/store/normalize"
import { ARTICLE_SECTIONS } from "@/lib/types"
import type { Article } from "@/lib/types"
import { currentUser, userPermissions } from "@/lib/accounts"

interface Props {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
    try {
        const { id } = await params
        const article = await getStore().getArticle(id)

        const user = await currentUser()
        const permissions = user ? await userPermissions(user) : []
        if (
            !article ||
            (article.status !== "published" &&
                !permissions.includes("articles.editAll") &&
                !(
                    user &&
                    article.ownerId === user.id &&
                    permissions.includes("articles.editOwn")
                ))
        ) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(article)
    } catch (error) {
        return handleError(error, "Failed to fetch article")
    }
}

export async function PUT(request: Request, { params }: Props) {
    const unauthorized = await requireAdmin("articles.editOwn")
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const { id } = await params
        const body = await request.json()
        const current = await getStore().getArticle(id)
        const user = (await currentUser())!
        const permissions = await userPermissions(user)
        if (!current)
            return NextResponse.json({ error: "Not found." }, { status: 404 })
        if (
            current.ownerId !== user.id &&
            !permissions.includes("articles.editAll")
        )
            return NextResponse.json(
                { error: "You can only edit your own articles." },
                { status: 403 }
            )
        const changesContent = [
            "title",
            "slug",
            "excerpt",
            "content",
            "category",
            "section",
            "author",
            "imageUrl",
            "sponsorship",
            "publishedAt",
        ].some((key) => body[key] !== undefined)
        if (
            ((body.status === "published" && current.status !== "published") ||
                (changesContent &&
                    current.status === "published" &&
                    body.status !== "draft")) &&
            !permissions.includes("articles.publish")
        )
            return NextResponse.json(
                {
                    error: "Published articles require publishing permission to edit.",
                },
                { status: 403 }
            )
        if (
            current.status === "published" &&
            body.status === "draft" &&
            !permissions.includes("articles.unpublish")
        )
            return NextResponse.json(
                { error: "Unpublishing requires permission." },
                { status: 403 }
            )
        if (
            ((body.featured !== undefined &&
                body.featured !== current.featured) ||
                body.pinnedAreas !== undefined ||
                body.manualOrder !== undefined) &&
            !permissions.includes("articles.feature")
        )
            return NextResponse.json(
                { error: "Featuring and ordering require permission." },
                { status: 403 }
            )

        const patch: Partial<Article> = {}
        if (permissions.includes("articles.feature")) {
            if (Array.isArray(body.pinnedAreas))
                patch.pinnedAreas = body.pinnedAreas
                    .filter((v: unknown) => typeof v === "string")
                    .slice(0, 20)
            if (Number.isFinite(body.manualOrder))
                patch.manualOrder = body.manualOrder
        }
        if (
            body.sponsorship !== undefined &&
            permissions.includes("articles.publish")
        )
            patch.sponsorship = String(body.sponsorship).slice(0, 160)
        if (body.title !== undefined) patch.title = String(body.title).trim()
        if (body.slug !== undefined) patch.slug = body.slug
        if (body.excerpt !== undefined) patch.excerpt = body.excerpt
        if (body.content !== undefined) patch.content = body.content
        if (body.category !== undefined) patch.category = body.category
        if (
            body.section !== undefined &&
            ARTICLE_SECTIONS.includes(body.section)
        )
            patch.section = body.section
        if (
            body.author !== undefined &&
            permissions.includes("articles.editAll")
        )
            patch.author = body.author
        if (body.publishedAt !== undefined) patch.publishedAt = body.publishedAt
        if (body.imageUrl !== undefined)
            patch.imageUrl = body.imageUrl || undefined
        if (body.imageAlt !== undefined)
            patch.imageAlt = body.imageAlt || undefined
        if (body.imageCredit !== undefined)
            patch.imageCredit = body.imageCredit || undefined
        if (body.status !== undefined)
            patch.status = body.status === "draft" ? "draft" : "published"
        if (body.featured !== undefined) patch.featured = body.featured === true

        // An empty read time means "recalculate from the body" rather than "blank it".
        if (body.readTime) {
            patch.readTime = body.readTime
        } else if (body.content !== undefined) {
            patch.readTime = estimateReadTime(body.content)
        }

        const updated = await getStore().updateArticle(id, patch)

        if (!updated) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            )
        }

        revalidateSite()
        return NextResponse.json(updated)
    } catch (error) {
        return handleError(error, "Failed to update article")
    }
}

export async function DELETE(request: Request, { params }: Props) {
    const unauthorized = await requireAdmin("articles.delete")
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const { id } = await params
        const current = await getStore().getArticle(id)
        const user = (await currentUser())!
        const permissions = await userPermissions(user)
        if (
            current &&
            current.ownerId !== user.id &&
            !permissions.includes("articles.editAll")
        )
            return NextResponse.json(
                { error: "You cannot delete another author's article." },
                { status: 403 }
            )
        if (
            current?.status === "published" &&
            !permissions.includes("articles.unpublish")
        )
            return NextResponse.json(
                { error: "Unpublish permission is required." },
                { status: 403 }
            )
        const deleted = await getStore().deleteArticle(id)

        if (!deleted) {
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            )
        }

        revalidateSite()
        return NextResponse.json({ message: "Deleted successfully" })
    } catch (error) {
        return handleError(error, "Failed to delete article")
    }
}
