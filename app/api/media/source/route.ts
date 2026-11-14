import { NextResponse } from "next/server"
import { readFile } from "node:fs/promises"
import path from "node:path"
import sharp from "sharp"
import { requireAdmin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api"
import { getStore } from "@/lib/store"
import { projectId, dataset } from "@/sanity/env"

export const runtime = "nodejs"
const MAX_BYTES = 4 * 1024 * 1024

/** Same-origin editing source. Never fetch arbitrary user-supplied hosts. */
export async function POST(request: Request) {
    const denied = await requireAdmin("media.manage")
    if (denied) return denied
    try {
        const { src } = await request.json()
        if (typeof src !== "string" || src.length > 2048) throw new Error("Choose an image from this site's media library.")
        const store = getStore()
        const asset = (await store.listMedia()).find(item => item.url === src)
        if (!asset) throw new Error("Choose an image from this site's media library or upload the original file.")
        let bytes: Buffer
        if (store.mode === "file" && /^\/uploads\/[a-zA-Z0-9._-]+$/.test(src)) {
            const directory = process.env.CMS_TEST_CONTENT_DIR && process.env.NODE_ENV !== "production" ? path.join(process.env.CMS_TEST_CONTENT_DIR, "uploads") : path.join(process.cwd(), "public", "uploads")
            bytes = await readFile(path.join(directory, path.basename(src)))
        } else {
            const url = new URL(src)
            if (url.origin !== "https://cdn.sanity.io" || !url.pathname.startsWith(`/images/${projectId}/${dataset}/`)) throw new Error("Upload this image to the media library before editing it.")
            const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(10000) })
            if (!response.ok || !response.body || Number(response.headers.get("content-length")) > MAX_BYTES) throw new Error("The image is unavailable or exceeds 4MB.")
            const reader = response.body.getReader(), chunks: Uint8Array[] = []
            let size = 0
            while (true) {
                const chunk = await reader.read()
                if (chunk.done) break
                size += chunk.value.length
                if (size > MAX_BYTES) { await reader.cancel(); throw new Error("Choose an image no larger than 4MB.") }
                chunks.push(chunk.value)
            }
            bytes = Buffer.concat(chunks)
        }
        if (!bytes.length || bytes.length > MAX_BYTES) throw new Error("Choose an image no larger than 4MB.")
        // Decode and re-encode a static raster; active SVG content is never returned.
        const image = sharp(bytes, { limitInputPixels: 25_000_000, failOn: "warning" })
        const info = await image.metadata()
        if (!["jpeg", "png", "webp", "gif", "avif"].includes(info.format || "")) throw new Error("Choose a JPG, PNG, WebP, GIF or AVIF image.")
        const preview = await image.rotate().webp({ quality: 95 }).toBuffer()
        return new Response(new Uint8Array(preview), { headers: { ...PRIVATE_RESPONSE_HEADERS, "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff" } })
    } catch (e) {
        return NextResponse.json({ error: e instanceof Error ? e.message : "Could not load this image for editing." }, { status: 400, headers: PRIVATE_RESPONSE_HEADERS })
    }
}
