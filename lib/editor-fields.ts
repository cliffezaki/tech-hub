import { validateBody } from "@/lib/rich-content"
export function editorFields(body: Record<string, unknown>) {
    if (body.quickFacts !== undefined && (!Array.isArray(body.quickFacts) || body.quickFacts.length > 4 || body.quickFacts.some(v => typeof v !== "string" || v.trim().length > 240))) throw new Error("Quick Facts must contain up to four facts of 240 characters or fewer.")
    return {
        ...(body.quickFacts !== undefined ? { quickFacts: [...new Set((body.quickFacts as string[]).map(v => v.trim()).filter(Boolean))] } : {}),
        ...(body.content !== undefined ? { content: validateBody(body.content) } : {}),
        ...(body.seoTitle !== undefined ? { seoTitle: String(body.seoTitle).slice(0, 120) } : {}),
        ...(body.metaDescription !== undefined ? { metaDescription: String(body.metaDescription).slice(0, 320) } : {}),
        ...(body.tags !== undefined ? { tags: Array.isArray(body.tags) ? body.tags.filter((v): v is string => typeof v === "string").map(v => v.trim().slice(0, 60)).filter(Boolean).slice(0, 30) : [] } : {}),
    }
}
