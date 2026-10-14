import { validateBody } from "@/lib/rich-content"
export function editorFields(body: Record<string, unknown>) {
    return {
        ...(body.content !== undefined ? { content: validateBody(body.content) } : {}),
        ...(body.seoTitle !== undefined ? { seoTitle: String(body.seoTitle).slice(0, 120) } : {}),
        ...(body.metaDescription !== undefined ? { metaDescription: String(body.metaDescription).slice(0, 320) } : {}),
        ...(body.tags !== undefined ? { tags: Array.isArray(body.tags) ? body.tags.filter((v): v is string => typeof v === "string").map(v => v.trim().slice(0, 60)).filter(Boolean).slice(0, 30) : [] } : {}),
    }
}
