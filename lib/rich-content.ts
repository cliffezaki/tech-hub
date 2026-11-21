export interface RichNode {
    type: string
    text?: string
    attrs?: Record<string, unknown>
    marks?: { type: string; attrs?: Record<string, unknown> }[]
    content?: RichNode[]
}
export const RICH_PREFIX = "TECHHUB_DOCUMENT_V1\n"
const nodes = new Set(["doc", "text", "paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock", "horizontalRule", "hardBreak", "image", "table", "tableRow", "tableCell", "tableHeader", "media", "pullQuote", "buttonLink", "gallery"])
const marks = new Set(["bold", "italic", "underline", "strike", "code", "link", "textStyle", "highlight"])
export function safeUrl(value: unknown, media = false): string {
    if (typeof value !== "string" || /[\u0000-\u0020\\]/.test(value)) return ""
    if (value.startsWith("/") && !value.startsWith("//")) return value
    try { const url = new URL(value); return (url.protocol === "https:" || (!media && ["http:", "mailto:"].includes(url.protocol))) ? value : "" } catch { return "" }
}
export function color(value: unknown) { return typeof value === "string" && /^(#[a-f\d]{3,8}|rgb\([\d\s,.%]+\))$/i.test(value) ? value : undefined }
export function validateDocument(value: unknown): RichNode {
    let count = 0
    function visit(input: unknown, depth: number): RichNode {
        if (!input || typeof input !== "object" || depth > 30 || ++count > 20000) throw new Error("Article structure is too large or invalid.")
        const n = input as RichNode
        if (!nodes.has(n.type)) throw new Error(`Unsupported content block: ${n.type}`)
        if (n.text !== undefined && typeof n.text !== "string") throw new Error("Invalid text.")
        if (n.marks && (!Array.isArray(n.marks) || n.marks.some(m => !marks.has(m.type)))) throw new Error("Unsupported text formatting.")
        if (n.attrs && (typeof n.attrs !== "object" || Array.isArray(n.attrs))) throw new Error("Invalid block settings.")
        if (n.content && !Array.isArray(n.content)) throw new Error("Invalid block content.")
        return { type: n.type, ...(n.text !== undefined ? { text: n.text } : {}), ...(n.attrs ? { attrs: n.attrs } : {}), ...(n.marks ? { marks: n.marks } : {}), ...(n.content ? { content: n.content.map(c => visit(c, depth + 1)) } : {}) }
    }
    const result = visit(value, 0)
    if (result.type !== "doc") throw new Error("Expected an article document.")
    return result
}
export function readDocument(content: string): RichNode | null {
    if (!content.startsWith(RICH_PREFIX)) return null
    return validateDocument(JSON.parse(content.slice(RICH_PREFIX.length)))
}
export function writeDocument(doc: unknown) { return RICH_PREFIX + JSON.stringify(validateDocument(doc)) }
export function validateBody(content: unknown): string {
    if (typeof content !== "string" || content.length > 1000000) throw new Error("Article must be smaller than 1MB.")
    if (content.startsWith(RICH_PREFIX)) readDocument(content)
    return content
}
export function documentText(content: string) {
    const doc = readDocument(content)
    if (!doc) return content
    const text = (n: RichNode): string => n.text || (n.content || []).map(text).join(" ")
    return text(doc)
}
export function embedUrl(value: unknown): string {
    if (typeof value !== "string") return ""
    try {
        const u = new URL(value)
        const id = u.hostname === "youtu.be" ? u.pathname.slice(1) : ["www.youtube.com", "youtube.com"].includes(u.hostname) ? u.searchParams.get("v") || u.pathname.split("/").pop() : ""
        if (id && /^[\w-]{11}$/.test(id)) return `https://www.youtube-nocookie.com/embed/${id}`
        if (["vimeo.com", "www.vimeo.com", "player.vimeo.com"].includes(u.hostname) && /^\d+$/.test(u.pathname.split("/").pop() || "")) return `https://player.vimeo.com/video/${u.pathname.split("/").pop()}`
        if (["instagram.com", "www.instagram.com"].includes(u.hostname) && /^\/(p|reel)\/[\w-]+\/?$/.test(u.pathname)) return `https://www.instagram.com${u.pathname.replace(/\/$/, "")}/embed/`
    } catch { /* Unsupported embeds stay ordinary links. */ }
    return ""
}
