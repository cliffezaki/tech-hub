import { NextResponse } from "next/server"

import { handleError, requireAdmin, requireWritableStore, revalidateSite } from "@/lib/api"
import { getStore } from "@/lib/store"

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif", "image/svg+xml"])

export async function GET() {
    try {
        const media = await getStore().listMedia()
        return NextResponse.json(media)
    } catch (error) {
        return handleError(error, "Failed to list media")
    }
}

export async function POST(request: Request) {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const formData = await request.formData()
        const file = formData.get("file")

        if (!(file instanceof File)) {
            return NextResponse.json({ error: "No file was uploaded." }, { status: 400 })
        }

        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                { error: "Unsupported file type. Upload a JPG, PNG, WebP, AVIF, GIF, or SVG image." },
                { status: 400 }
            )
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json({ error: "Images must be 8MB or smaller." }, { status: 400 })
        }

        const media = await getStore().uploadMedia({
            filename: file.name || "upload.jpg",
            contentType: file.type,
            data: Buffer.from(await file.arrayBuffer()),
        })

        revalidateSite()
        return NextResponse.json(media, { status: 201 })
    } catch (error) {
        return handleError(error, "Failed to upload image")
    }
}

export async function DELETE(request: Request) {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const id = new URL(request.url).searchParams.get("id")

        if (!id) {
            return NextResponse.json({ error: "An image id is required." }, { status: 400 })
        }

        const deleted = await getStore().deleteMedia(id)

        if (!deleted) {
            return NextResponse.json(
                { error: "That image could not be deleted. It may still be used by an article." },
                { status: 409 }
            )
        }

        revalidateSite()
        return NextResponse.json({ message: "Deleted successfully" })
    } catch (error) {
        return handleError(error, "Failed to delete image")
    }
}
