import { demoPhoto } from "@/lib/demo-photos"
import { ARTICLE_SECTIONS, DEFAULT_SETTINGS, SECTION_META } from "@/lib/types"
import { documentText } from "@/lib/rich-content"
import { randomUUID } from "node:crypto"
import type {
    Article,
    ArticleSection,
    ArticleStatus,
    PageContent,
    SiteSettings,
} from "@/lib/types"

export function slugify(text: string) {
    return String(text)
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
}

export function generateId() {
    return randomUUID()
}

function asSection(value: unknown): ArticleSection {
    return ARTICLE_SECTIONS.includes(value as ArticleSection)
        ? (value as ArticleSection)
        : "news"
}

function asStatus(value: unknown): ArticleStatus {
    return value === "draft" ? "draft" : "published"
}

function asDate(value: unknown): string {
    if (typeof value === "string" && value.trim()) {
        const parsed = new Date(value)
        if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString()
        }
    }

    return new Date().toISOString()
}

/** Roughly 200 words per minute, which is the usual reading-speed assumption for news copy. */
export function estimateReadTime(content: string) {
    const words = documentText(String(content || ""))
        .trim()
        .split(/\s+/)
        .filter(Boolean).length
    return `${Math.max(1, Math.ceil(words / 200))} min read`
}

/**
 * Older stored articles predate the status/featured fields, so every read goes through
 * this to guarantee the shape the rest of the app expects.
 */
export function normalizeArticle(input: unknown): Article {
    const raw = (input || {}) as Record<string, unknown>
    const section = asSection(raw.section)
    const title = String(raw.title || "Untitled article")
    const photo = demoPhoto(raw)
    const content = photo ? String(raw.content || "").replace("Original Tech Hub illustrations; no third-party news photographs.", "Conceptual diagrams are original Tech Hub illustrations. Cover photograph credited above.") : String(raw.content || "")

    return {
        demo: raw.demo === true,
        demoBatch: typeof raw.demoBatch === "string" ? raw.demoBatch : undefined,
        id: String(raw.id || generateId()),
        title,
        slug: slugify(String(raw.slug || title)) || generateId(),
        excerpt: String(raw.excerpt || ""),
        content,
        seoTitle: typeof raw.seoTitle === "string" ? raw.seoTitle : "",
        scheduledAt: typeof raw.scheduledAt === "string" ? raw.scheduledAt : "",
        metaDescription: typeof raw.metaDescription === "string" ? raw.metaDescription : "",
        tags: Array.isArray(raw.tags) ? raw.tags.filter((v): v is string => typeof v === "string") : [],
        category: String(raw.category || SECTION_META[section].defaultCategory),
        section,
        author: raw.demo === true && raw.author === "Tech Hub Demo Desk" ? "Tech Hub" : String(raw.author || "Tech Hub Staff"),
        publishedAt: asDate(raw.publishedAt),
        readTime: String(raw.readTime || estimateReadTime(content)),
        imageUrl:
            typeof raw.imageUrl === "string" && raw.imageUrl.trim()
                ? raw.imageUrl.trim()
                : undefined,
        imageAlt:
            typeof raw.imageAlt === "string" && raw.imageAlt.trim()
                ? raw.imageAlt.trim()
                : undefined,
        imageCredit:
            typeof raw.imageCredit === "string" && raw.imageCredit.trim()
                ? raw.imageCredit.trim()
                : undefined,
        ...photo,
        status: asStatus(raw.status),
        featured: raw.featured === true,
        ownerId: typeof raw.ownerId === "string" ? raw.ownerId : undefined,
        pinnedAreas: Array.isArray(raw.pinnedAreas)
            ? raw.pinnedAreas.filter((v): v is string => typeof v === "string")
            : [],
        manualOrder: typeof raw.manualOrder === "number" ? raw.manualOrder : 0,
        sponsorship: typeof raw.sponsorship === "string" ? raw.sponsorship : "",
        updatedAt:
            typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    }
}

export function normalizePage(input: unknown): PageContent {
    const raw = (input || {}) as Record<string, unknown>
    const title = String(raw.title || "Untitled page")

    return {
        id: String(raw.id || generateId()),
        title,
        slug: slugify(String(raw.slug || title)) || generateId(),
        status: asStatus(raw.status),
        excerpt: String(raw.excerpt || ""),
        content: String(raw.content || ""),
        updatedAt: asDate(raw.updatedAt),
    }
}

export function normalizeSettings(
    raw: Partial<SiteSettings> | null | undefined
): SiteSettings {
    const settings = { ...DEFAULT_SETTINGS }

    if (raw) {
        for (const key of Object.keys(
            DEFAULT_SETTINGS
        ) as (keyof SiteSettings)[]) {
            const value = raw[key]
            if (typeof value === "string") {
                settings[key] = value
            }
        }
    }

    return settings
}

export function sortByPublishedAt<T extends { publishedAt: string }>(
    items: T[]
) {
    return [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
