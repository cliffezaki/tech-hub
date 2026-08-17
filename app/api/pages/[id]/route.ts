import { NextResponse } from "next/server"
import { deletePage, getPage, updatePage } from "@/lib/pages"

interface Props {
    params: Promise<{ id: string }>
}

export async function GET(request: Request, { params }: Props) {
    const { id } = await params
    const page = await getPage(id)

    if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json(page)
}

export async function PUT(request: Request, { params }: Props) {
    const { id } = await params
    const body = await request.json()
    const page = await updatePage(id, body)

    if (!page) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json(page)
}

export async function DELETE(request: Request, { params }: Props) {
    const { id } = await params
    const deleted = await deletePage(id)

    if (!deleted) {
        return NextResponse.json({ error: "Page not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Deleted successfully" })
}
