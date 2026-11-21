import sharp from "sharp"
import { SaxesParser } from "saxes"

export const MAX_IDENTITY_BYTES = 4 * 1024 * 1024
const tags = new Set("svg g path rect circle ellipse line polyline polygon defs linearGradient radialGradient stop clipPath mask title desc text tspan".split(" "))
const attrs = new Set("xmlns viewBox width height x y x1 x2 y1 y2 cx cy r rx ry d points fill fill-rule fill-opacity stroke stroke-width stroke-linecap stroke-linejoin stroke-opacity opacity transform id gradientUnits gradientTransform offset stop-color stop-opacity clip-path clip-rule mask font-family font-size font-weight text-anchor dominant-baseline preserveAspectRatio".split(" "))
const escape = (s: string) => s.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")

/** Strict static-SVG allowlist, then rasterization: no active SVG reaches storage or a browser. */
export function sanitizeIdentitySvg(source: string) {
    const parser = new SaxesParser({ xmlns: false })
    let output = "", count = 0
    parser.on("doctype", () => { throw new Error("SVG document types and entities are not supported.") })
    parser.on("processinginstruction", () => { throw new Error("SVG processing instructions are not supported.") })
    parser.on("opentag", tag => {
        if (++count > 10000 || !tags.has(tag.name) || (count === 1 && tag.name !== "svg")) throw new Error("Use a simple static SVG without scripts, styles, links or embedded images.")
        output += `<${tag.name}`
        for (const [key, value] of Object.entries(tag.attributes)) {
            if (!attrs.has(key)) throw new Error(`Unsupported SVG attribute: ${key}. Export a plain SVG or PNG instead.`)
            if (key === "xmlns" && value !== "http://www.w3.org/2000/svg") throw new Error("Invalid SVG namespace.")
            if (/url\s*\(/i.test(value) && !/^url\(#[a-zA-Z0-9_-]+\)$/.test(value)) throw new Error("External SVG resources are not allowed.")
            if (/javascript:|data:|https?:|file:|\\|@/i.test(value) && key !== "xmlns") throw new Error("External SVG resources are not allowed.")
            output += ` ${key}="${escape(value)}"`
        }
        output += ">"
    })
    parser.on("closetag", tag => { output += `</${tag.name}>` })
    parser.on("text", value => { output += escape(value) })
    parser.write(source).close()
    return Buffer.from(output)
}

export type IdentityKind = "logo" | "icon" | "social"
export interface ImageAdjustment { crop?: boolean; x?: number; y?: number; zoom?: number }
export async function prepareIdentityImage(data: Buffer, kind: IdentityKind, adjustment: ImageAdjustment = {}) {
    if (!data.length || data.length > MAX_IDENTITY_BYTES) throw new Error("Choose an image no larger than 4 MB.")
    const text = data.subarray(0, 512).toString().trimStart()
    if (text.startsWith("<")) data = sanitizeIdentitySvg(data.toString())
    const options = { limitInputPixels: 25_000_000, failOn: "warning" as const }
    const metadata = await sharp(data, options).metadata()
    if (!["png", "jpeg", "webp", "svg"].includes(metadata.format || "") || (metadata.pages || 1) > 1) throw new Error("Choose a static PNG, JPG, WebP or simple SVG image.")
    // Decode, orient, strip metadata, and sanitize every source (including library images).
    const normalized = await sharp(data, options).rotate().png().toBuffer()
    const info = await sharp(normalized).metadata()
    let pipeline = sharp(normalized)
    if (adjustment.crop) {
        const ratio = kind === "icon" ? 1 : kind === "social" ? 1200 / 630 : 3
        const zoom = Math.min(3, Math.max(1, Number(adjustment.zoom) || 1))
        const width = Math.max(1, Math.floor(Math.min(info.width!, info.height! * ratio) / zoom))
        const height = Math.max(1, Math.floor(width / ratio))
        const x = Math.min(100, Math.max(0, Number(adjustment.x) || 0)) / 100
        const y = Math.min(100, Math.max(0, Number(adjustment.y) || 0)) / 100
        pipeline = pipeline.extract({ width, height, left: Math.round((info.width! - width) * x), top: Math.round((info.height! - height) * y) })
    }
    return pipeline.resize(kind === "social" ? 1200 : kind === "icon" ? 512 : 1200, kind === "social" ? 630 : kind === "icon" ? 512 : 400, { fit: "contain", background: "#00000000" }).png().toBuffer()
}

export function encodeIco(images: { size: number; data: Buffer }[]) {
    const header = Buffer.alloc(6 + 16 * images.length)
    header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4)
    let offset = header.length
    images.forEach(({ size, data }, i) => {
        const pos = 6 + i * 16
        header[pos] = size === 256 ? 0 : size; header[pos + 1] = header[pos]
        header.writeUInt16LE(1, pos + 4); header.writeUInt16LE(32, pos + 6)
        header.writeUInt32LE(data.length, pos + 8); header.writeUInt32LE(offset, pos + 12)
        offset += data.length
    })
    return Buffer.concat([header, ...images.map(i => i.data)])
}
