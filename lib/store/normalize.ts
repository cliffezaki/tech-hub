import { ARTICLE_SECTIONS, DEFAULT_SETTINGS, SECTION_META } from "@/lib/types"
import type { Article, ArticleSection, ArticleStatus, PageContent, SiteSettings } from "@/lib/types"

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
    return Math.random().toString(36).slice(2, 10)
}

function asSection(value: unknown): ArticleSection {
    return ARTICLE_SECTIONS.includes(value as ArticleSection) ? (value as ArticleSection) : "news"
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
    const words = String(content || "").trim().split(/\s+/).filter(Boolean).length
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
    const content = String(raw.content || "")

    return {
        id: String(raw.id || generateId()),
        title,
        slug: slugify(String(raw.slug || title)) || generateId(),
        excerpt: String(raw.excerpt || ""),
        content,
        category: String(raw.category || SECTION_META[section].defaultCategory),
        section,
        author: String(raw.author || "Tech Hub Staff"),
        publishedAt: asDate(raw.publishedAt),
        readTime: String(raw.readTime || estimateReadTime(content)),
        imageUrl: typeof raw.imageUrl === "string" && raw.imageUrl.trim() ? raw.imageUrl.trim() : undefined,
        imageAlt: typeof raw.imageAlt === "string" && raw.imageAlt.trim() ? raw.imageAlt.trim() : undefined,
        imageCredit: typeof raw.imageCredit === "string" && raw.imageCredit.trim() ? raw.imageCredit.trim() : undefined,
        status: asStatus(raw.status),
        featured: raw.featured === true,
        updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
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

export function normalizeSettings(raw: Partial<SiteSettings> | null | undefined): SiteSettings {
    const settings = { ...DEFAULT_SETTINGS }

    if (raw) {
        for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
            const value = raw[key]
            if (typeof value === "string") {
                settings[key] = value
            }
        }
    }

    return settings
}

export function sortByPublishedAt<T extends { publishedAt: string }>(items: T[]) {
    return [...items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
}
