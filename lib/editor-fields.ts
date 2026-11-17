import { ARTICLE_FONTS } from "@/lib/editor-fonts"
import { validateBody } from "@/lib/rich-content"
export function editorFields(body: Record<string, unknown>) {
    if (body.quickFacts !== undefined && (!Array.isArray(body.quickFacts) || body.quickFacts.length > 6 || body.quickFacts.some(v => typeof v !== "string" || v.trim().length > 240))) throw new Error("Quick Facts must contain up to six facts of 240 characters or fewer.")
    if(body.titleFont !== undefined && body.titleFont !== "" && !ARTICLE_FONTS.includes(String(body.titleFont))) throw new Error("Choose a supported headline font.")
    if(body.titleSize !== undefined && body.titleSize !== "" && (!/^\d+px$/.test(String(body.titleSize)) || parseInt(String(body.titleSize))<16 || parseInt(String(body.titleSize))>72)) throw new Error("Headline size must be 16–72px.")
    for(const key of ["titleBold","titleItalic"]) if(body[key] !== undefined && typeof body[key] !== "boolean") throw new Error("Headline formatting must be true or false.")
    return {
        ...(body.titleBold !== undefined ? {titleBold:body.titleBold as boolean} : {}),
        ...(body.titleItalic !== undefined ? {titleItalic:body.titleItalic as boolean} : {}),
        ...(body.titleFont !== undefined ? {titleFont:String(body.titleFont)} : {}),
        ...(body.titleSize !== undefined ? {titleSize:String(body.titleSize)} : {}),
        ...(body.quickFacts !== undefined ? { quickFacts: [...new Set((body.quickFacts as string[]).map(v => v.trim()).filter(Boolean))] } : {}),
        ...(body.content !== undefined ? { content: validateBody(body.content) } : {}),
        ...(body.seoTitle !== undefined ? { seoTitle: String(body.seoTitle).slice(0, 120) } : {}),
        ...(body.metaDescription !== undefined ? { metaDescription: String(body.metaDescription).slice(0, 320) } : {}),
        ...(body.tags !== undefined ? { tags: Array.isArray(body.tags) ? body.tags.filter((v): v is string => typeof v === "string").map(v => v.trim().slice(0, 60)).filter(Boolean).slice(0, 30) : [] } : {}),
    }
}
