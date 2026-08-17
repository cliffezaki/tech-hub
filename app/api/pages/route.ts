import { NextResponse } from "next/server"
import { createPage, getPages } from "@/lib/pages"

export async function GET() {
    try {
        const pages = await getPages()
        return NextResponse.json(pages)
    } catch {
        return NextResponse.json({ error: "Failed to fetch pages" }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json()

        if (!body.title || !body.slug) {
            return NextResponse.json({ error: "Title and slug are required" }, { status: 400 })
        }

        const page = await createPage({
            title: body.title,
            slug: body.slug,
            status: body.status || "draft",
            excerpt: body.excerpt || "",
            content: body.content || "",
        })

        return NextResponse.json(page, { status: 201 })
    } catch {
        return NextResponse.json({ error: "Failed to create page" }, { status: 500 })
    }
}
