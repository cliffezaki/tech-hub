import { NextResponse } from "next/server"

import { handleError, requireAdmin, requireWritableStore, revalidateSite } from "@/lib/api"
import { getStore } from "@/lib/store"

export async function GET() {
    try {
        const pages = await getStore().listPages()
        return NextResponse.json(pages)
    } catch (error) {
        return handleError(error, "Failed to fetch pages")
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
