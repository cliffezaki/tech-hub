import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import sharp from "sharp"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { requireAdmin, requireWritableStore } from "@/lib/api"
import { getStore } from "@/lib/store"
import { MAX_IDENTITY_BYTES, prepareIdentityImage, encodeIco, type IdentityKind } from "@/lib/identity-image"
import { projectId, dataset } from "@/sanity/env"

export const runtime = "nodejs"
export async function POST(request: Request) {
    const denied = await requireAdmin("settings.manage")
    if (denied) return denied
    const readOnly = requireWritableStore()
    if (readOnly) return readOnly
    if (Number(request.headers.get("content-length")) > MAX_IDENTITY_BYTES + 65536) return NextResponse.json({ error: "Choose an image no larger than 4 MB." }, { status: 413 })
    try {
        const form = await request.formData()
        const kind = String(form.get("kind")) as IdentityKind
        if (!["logo", "icon", "social"].includes(kind)) throw new Error("Invalid image purpose.")
        const store = getStore()
        const file = form.get("file")
        let data: Buffer
        if (file instanceof File) {
            if (!/\.(png|jpe?g|webp|svg)$/i.test(file.name) || file.size > MAX_IDENTITY_BYTES) throw new Error("Choose PNG, JPG, WebP or SVG, no larger than 4 MB.")
            data = Buffer.from(await file.arrayBuffer())
        } else {
            const asset = (await store.listMedia()).find(a => a.id === form.get("assetId"))
            if (!asset || !/\.(png|jpe?g|webp|svg)$/i.test(asset.url)) throw new Error("Choose an image from the media library.")
            if (store.mode === "file" && /^\/uploads\/[a-zA-Z0-9._-]+$/.test(asset.url)) {
                const directory = process.env.CMS_TEST_CONTENT_DIR && process.env.NODE_ENV !== "production" ? path.join(process.env.CMS_TEST_CONTENT_DIR, "uploads") : path.join(process.cwd(), "public", "uploads")
                data = await readFile(path.join(directory, path.basename(asset.url)))
            } else {
                const url = new URL(asset.url)
                if (url.origin !== "https://cdn.sanity.io" || !url.pathname.startsWith(`/images/${projectId}/${dataset}/`)) throw new Error("Only this site's media library is supported.")
                const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10000) })
                if (!response.ok || Number(response.headers.get("content-length")) > MAX_IDENTITY_BYTES) throw new Error("The source image is unavailable or too large.")
                const reader = response.body!.getReader(), chunks: Uint8Array[] = []
                let size = 0
                while (true) {
                    const chunk = await reader.read()
                    if (chunk.done) break
                    size += chunk.value.length
                    if (size > MAX_IDENTITY_BYTES) { await reader.cancel(); throw new Error("Choose an image no larger than 4 MB.") }
                    chunks.push(chunk.value)
                }
                data = Buffer.concat(chunks)
            }
        }
        const png = await prepareIdentityImage(data, kind, { crop: form.get("crop") === "true", x: Number(form.get("x") ?? 50), y: Number(form.get("y") ?? 50), zoom: Number(form.get("zoom") ?? 1) })
        const prefix = `identity-${randomUUID()}`
        const source = await store.uploadMedia({ filename: `${prefix}-${kind}.png`, contentType: "image/png", data: png })
        if (kind !== "icon") return NextResponse.json({ url: source.url })
        const icons: Record<string, string> = { iconSource: source.url, icon512: source.url }
        const icoImages = []
        for (const size of [16, 32, 180, 192]) {
            const buffer = await sharp(png).resize(size, size).png().toBuffer()
            const asset = await store.uploadMedia({ filename: `${prefix}-${size}.png`, contentType: "image/png", data: buffer })
            icons[`icon${size}`] = asset.url
            if (size <= 32) icoImages.push({ size, data: buffer })
        }
        const ico = await store.uploadMedia({ filename: `${prefix}.ico`, contentType: "application/octet-stream", data: encodeIco(icoImages) })
        icons.iconIco = ico.url
        return NextResponse.json({ url: source.url, icons })
    } catch (error) {
        console.error("Identity image processing failed", error)
        return NextResponse.json({ error: error instanceof Error ? error.message : "Could not process this image." }, { status: 400 })
    }
}
