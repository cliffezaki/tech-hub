import { NextResponse } from "next/server"

import {
    handleError,
    requireAdmin,
    requireWritableStore,
    revalidateSite,
} from "@/lib/api"
import { getStore } from "@/lib/store"
import { estimateReadTime } from "@/lib/store/normalize"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"
import type { ArticleSection } from "@/lib/types"
import { currentUser, userPermissions } from "@/lib/accounts"

export async function GET() {
    try {
        const articles = await getStore().listArticles()
        const user = await currentUser()
        const permissions = user ? await userPermissions(user) : []
        return NextResponse.json(
            articles.filter(
                (a) =>
                    a.status === "published" ||
                    permissions.includes("articles.editAll") ||
                    (user &&
                        a.ownerId === user.id &&
                        permissions.includes("articles.editOwn"))
            )
        )
    } catch (error) {
        return handleError(error, "Failed to fetch articles")
    }
}

export async function POST(request: Request) {
    const unauthorized = await requireAdmin("articles.create")
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const body = await request.json()
        const user = (await currentUser())!
        const permissions = await userPermissions(user)
        if (
            body.status === "published" &&
            !permissions.includes("articles.publish")
        )
            return NextResponse.json(
                {
                    error: "Publishing requires publish permission. Save a draft instead.",
                },
                { status: 403 }
            )
        if (body.featured && !permissions.includes("articles.feature"))
            return NextResponse.json(
                { error: "Featuring requires permission." },
                { status: 403 }
            )

        if (!body.title?.trim()) {
            return NextResponse.json(
                { error: "A title is required." },
                { status: 400 }
            )
        }

        const section: ArticleSection = ARTICLE_SECTIONS.includes(body.section)
            ? body.section
            : "news"

        const article = await getStore().createArticle({
            ownerId: user.id,
            title: body.title.trim(),
            slug: body.slug || body.title,
            excerpt: body.excerpt || "",
            content: body.content || "",
            category: body.category || SECTION_META[section].defaultCategory,
            section,
            author: permissions.includes("articles.editAll")
                ? body.author || user.name
                : user.name,
            publishedAt: body.publishedAt || new Date().toISOString(),
            readTime: body.readTime || estimateReadTime(body.content || ""),
            imageUrl: body.imageUrl || undefined,
            imageAlt: body.imageAlt || undefined,
            imageCredit: body.imageCredit || undefined,
            status: body.status === "published" ? "published" : "draft",
            featured: body.featured === true,
        })

        revalidateSite()
        return NextResponse.json(article, { status: 201 })
    } catch (error) {
        return handleError(error, "Failed to create article")
    }
}
