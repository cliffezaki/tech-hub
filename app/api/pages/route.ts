import { NextResponse } from "next/server"

import {
    handleError,
    requireAdmin,
    requireWritableStore,
    revalidateSite,
} from "@/lib/api"
import { getStore } from "@/lib/store"
import { authorized } from "@/lib/accounts"
import { mergeBuiltinPages, BUILTIN_PAGES } from "@/lib/builtin-pages"
import { slugify } from "@/lib/store/normalize"

export async function GET() {
    try {
        const manager = await authorized("pages.manage")
        const pages = mergeBuiltinPages(await getStore().listPages(Boolean(manager)))
        return NextResponse.json(
            manager
                ? pages
                : pages.filter((p) => p.status === "published")
        )
    } catch (error) {
        return handleError(error, "Failed to fetch pages")
    }
}

export async function POST(request: Request) {
    const unauthorized = await requireAdmin("pages.manage")
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const body = await request.json()

        if (!body.title?.trim()) {
            return NextResponse.json(
                { error: "A title is required." },
                { status: 400 }
            )
        }

        const slug = slugify(body.slug || body.title)
        if (
            BUILTIN_PAGES.some((p) => p.slug === slug) ||
            (await getStore().getPageBySlug(slug)) ||
            ["admin", "account", "api", "studio", "search"].includes(slug)
        )
            return NextResponse.json(
                {
                    error: "This page already exists or the route is reserved. Edit the existing page instead.",
                },
                { status: 409 }
            )
        const page = await getStore().createPage({
            title: body.title.trim(),
            slug: body.slug || body.title,
            excerpt: body.excerpt || "",
            content: body.content || "",
            status: body.status === "published" ? "published" : "draft",
        })

        revalidateSite()
        return NextResponse.json(page, { status: 201 })
    } catch (error) {
        return handleError(error, "Failed to create page")
    }
}
