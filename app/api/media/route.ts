import { NextResponse } from "next/server"

import {
    handleError,
    requireAdmin,
    requireWritableStore,
    revalidateSite,
} from "@/lib/api"
import { getStore } from "@/lib/store"
import { IDENTITY_IMAGES } from "@/lib/site-identity"

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024
const ALLOWED_TYPES = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/avif",
    "application/pdf",
    "video/mp4", "video/webm", "audio/mpeg",
])

export async function GET() {
    try {
        const media = await getStore().listMedia()
        return NextResponse.json(media)
    } catch (error) {
        return handleError(error, "Failed to list media")
    }
}

export async function POST(request: Request) {
    const unauthorized = await requireAdmin("media.manage")
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const formData = await request.formData()
        const file = formData.get("file")

        if (!(file instanceof File)) {
            return NextResponse.json(
                { error: "No file was uploaded." },
                { status: 400 }
            )
        }

        if (!ALLOWED_TYPES.has(file.type)) {
            return NextResponse.json(
                {
                    error: "Upload JPG, PNG, WebP, AVIF, GIF, PDF, MP4, WebM or MP3. Active SVG uploads are not supported.",
                },
                { status: 400 }
            )
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            return NextResponse.json(
                { error: "Files must be 4MB or smaller. Embed larger videos using YouTube or Vimeo." },
                { status: 400 }
            )
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
    const unauthorized = await requireAdmin("media.manage")
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const id = new URL(request.url).searchParams.get("id")

        if (!id) {
            return NextResponse.json(
                { error: "An image id is required." },
                { status: 400 }
            )
        }

        const store = getStore()
        const asset = (await store.listMedia()).find((item) => item.id === id)
        if (asset) {
            const identity = await store.getSettings()
            if (IDENTITY_IMAGES.some(key => identity[key] === asset.url)) return NextResponse.json({ error: "This image is used by Site Identity. Replace or remove it in Settings first." }, { status: 409 })
            const [articles, pages] = await Promise.all([store.listArticles(), store.listPages()])
            if (articles.some((a) => a.imageUrl?.startsWith(asset.url) || a.content.includes(asset.url)) ||
                pages.some((p) => p.content.includes(asset.url))) {
                return NextResponse.json(
                    { error: "This image is still used in content. Remove those references before deleting it." },
                    { status: 409 }
                )
            }
        }
        const deleted = await store.deleteMedia(id)

        if (!deleted) {
            return NextResponse.json(
                {
                    error: "That image could not be deleted. It may still be used by an article.",
                },
                { status: 409 }
            )
        }

        revalidateSite()
        return NextResponse.json({ message: "Deleted successfully" })
    } catch (error) {
        return handleError(error, "Failed to delete image")
    }
}
