import { NextResponse } from "next/server"

import {
    handleError,
    requireAdmin,
    requireWritableStore,
    revalidateSite,
} from "@/lib/api"
import { getStore } from "@/lib/store"
import type { PageContent } from "@/lib/types"
import { authorized } from "@/lib/accounts"
import { BUILTIN_PAGES } from "@/lib/builtin-pages"
import { slugify } from "@/lib/store/normalize"

interface Props {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
    try {
        const { id } = await params
        const builtin = BUILTIN_PAGES.find((p) => p.id === id)
        const page = builtin
            ? (await getStore().getPageBySlug(builtin.slug)) || builtin
            : await getStore().getPage(id)

        if (
            !page ||
            (page.status !== "published" && !(await authorized("pages.manage")))
        ) {
            return NextResponse.json(
                { error: "Page not found" },
                { status: 404 }
            )
        }

        return NextResponse.json(page)
    } catch (error) {
        return handleError(error, "Failed to fetch page")
    }
}

export async function PUT(request: Request, { params }: Props) {
    const unauthorized = await requireAdmin("pages.manage")
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const { id } = await params
        const body = await request.json()

        const patch: Partial<PageContent> = {}
        if (body.title !== undefined) patch.title = String(body.title).trim()
        if (body.slug !== undefined) patch.slug = body.slug
        if (body.excerpt !== undefined) patch.excerpt = body.excerpt
        if (body.content !== undefined) patch.content = body.content
        if (body.status !== undefined)
            patch.status = body.status === "published" ? "published" : "draft"

        const builtin = BUILTIN_PAGES.find((p) => p.id === id)
        const existing = builtin
            ? await getStore().getPageBySlug(builtin.slug)
            : await getStore().getPage(id)
        if (
            patch.slug &&
            existing &&
            patch.slug !== existing.slug &&
            BUILTIN_PAGES.some((p) => p.slug === existing.slug)
        )
            return NextResponse.json(
                { error: "Built-in routes retain their existing URL." },
                { status: 400 }
            )
        if (patch.slug && !builtin) {
            const collision = await getStore().getPageBySlug(
                slugify(patch.slug)
            )
            if (
                (collision && collision.id !== id) ||
                ["admin", "account", "api", "studio", "search"].includes(
                    slugify(patch.slug)
                )
            )
                return NextResponse.json(
                    { error: "That URL is already in use or reserved." },
                    { status: 409 }
                )
        }
        const updated =
            builtin && !existing
                ? await getStore().createPage({
                      ...builtin,
                      ...patch,
                      slug: builtin.slug,
                  })
                : await getStore().updatePage(
                      existing?.id || id,
                      builtin ? { ...patch, slug: builtin.slug } : patch
                  )

        if (!updated) {
            return NextResponse.json(
                { error: "Page not found" },
                { status: 404 }
            )
        }

        revalidateSite()
        return NextResponse.json(updated)
    } catch (error) {
        return handleError(error, "Failed to update page")
    }
}

export async function DELETE(request: Request, { params }: Props) {
    const unauthorized = await requireAdmin("pages.manage")
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const { id } = await params
        const existing = await getStore().getPage(id)
        if (BUILTIN_PAGES.some((p) => p.id === id || p.slug === existing?.slug))
            return NextResponse.json(
                {
                    error: "Unpublish built-in pages instead of deleting their routes.",
                },
                { status: 400 }
            )
        const deleted = await getStore().deletePage(id)

        if (!deleted) {
            return NextResponse.json(
                { error: "Page not found" },
                { status: 404 }
            )
        }

        revalidateSite()
        return NextResponse.json({ message: "Deleted successfully" })
    } catch (error) {
        return handleError(error, "Failed to delete page")
    }
}
