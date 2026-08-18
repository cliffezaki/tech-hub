import { NextResponse } from "next/server"

import { handleError, requireAdmin, requireWritableStore, revalidateSite } from "@/lib/api"
import { getStore } from "@/lib/store"
import type { PageContent } from "@/lib/types"

interface Props {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
    try {
        const { id } = await params
        const page = await getStore().getPage(id)

        if (!page) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 })
        }

        return NextResponse.json(page)
    } catch (error) {
        return handleError(error, "Failed to fetch page")
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

        const patch: Partial<PageContent> = {}
        if (body.title !== undefined) patch.title = String(body.title).trim()
        if (body.slug !== undefined) patch.slug = body.slug
        if (body.excerpt !== undefined) patch.excerpt = body.excerpt
        if (body.content !== undefined) patch.content = body.content
        if (body.status !== undefined) patch.status = body.status === "published" ? "published" : "draft"

        const updated = await getStore().updatePage(id, patch)

        if (!updated) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 })
        }

        revalidateSite()
        return NextResponse.json(updated)
    } catch (error) {
        return handleError(error, "Failed to update page")
    }
}

export async function DELETE(request: Request, { params }: Props) {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const { id } = await params
        const deleted = await getStore().deletePage(id)

        if (!deleted) {
            return NextResponse.json({ error: "Page not found" }, { status: 404 })
        }

        revalidateSite()
        return NextResponse.json({ message: "Deleted successfully" })
    } catch (error) {
        return handleError(error, "Failed to delete page")
    }
}
