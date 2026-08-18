import "server-only"

import { getStore } from "@/lib/store"
import { SECTION_META } from "@/lib/types"
import type { Article, ArticleSection, ArticleSummary, PageContent, SiteSettings } from "@/lib/types"

export interface ArticleDetail extends ArticleSummary {
    content: string
    imageCredit?: string
}

function toSummary(article: Article): ArticleSummary {
    return {
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        category: article.category,
        section: article.section,
        author: article.author,
        publishedAt: article.publishedAt,
        readTime: article.readTime,
        href: `/${article.section}/${article.slug}`,
        imageUrl: article.imageUrl,
        imageAlt: article.imageAlt,
        featured: article.featured,
    }
}

function isPublished(article: Article) {
    return article.status === "published"
}

/** Every public read goes through here, so drafts can never leak onto the live site. */
async function getPublishedArticles(): Promise<Article[]> {
    const articles = await getStore().listArticles()
    return articles.filter(isPublished)
}

export async function getSectionArticles(section: ArticleSection): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    return articles.filter((article) => article.section === section).map(toSummary)
}

export async function getLatestArticles(limit = 12): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    return articles.slice(0, limit).map(toSummary)
}

export async function getAllArticleSummaries(): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    return articles.map(toSummary)
}

export async function getArticleDetail(section: ArticleSection, slug: string): Promise<ArticleDetail | null> {
    const article = await getStore().getArticleBySlug(slug)

    if (!article || article.section !== section || !isPublished(article)) {
        return null
    }

    return {
        ...toSummary(article),
        content: article.content,
        imageCredit: article.imageCredit,
    }
}

/**
 * Homepage composition: the pinned lead story if the dashboard set one, otherwise the
 * newest featured article, otherwise simply the newest article.
 */
export interface HomepageContent {
    settings: SiteSettings
    lead: ArticleSummary | null
    secondary: ArticleSummary[]
    featured: ArticleSummary[]
    latest: ArticleSummary[]
    bySection: { section: ArticleSection; title: string; href: string; articles: ArticleSummary[] }[]
    totalArticles: number
}

export async function getHomepageContent(): Promise<HomepageContent> {
    const store = getStore()
    const [articles, settings] = await Promise.all([getPublishedArticles(), store.getSettings()])
    const summaries = articles.map(toSummary)

    const featured = summaries.filter((article) => article.featured)
    const pinned = settings.heroArticleId
        ? summaries.find((article) => article.id === settings.heroArticleId)
        : undefined

    const lead = pinned || featured[0] || summaries[0] || null
    const rest = summaries.filter((article) => article.id !== lead?.id)
    const secondary = [...featured.filter((article) => article.id !== lead?.id), ...rest]
        .filter((article, index, all) => all.findIndex((item) => item.id === article.id) === index)
        .slice(0, 2)

    const usedIds = new Set([lead?.id, ...secondary.map((article) => article.id)].filter(Boolean))

    const bySection = (Object.keys(SECTION_META) as ArticleSection[])
        .map((section) => ({
            section,
            title: SECTION_META[section].title,
            href: `/${section}`,
            articles: summaries.filter((article) => article.section === section).slice(0, 4),
        }))
        .filter((group) => group.articles.length > 0)

    return {
        settings,
        lead,
        secondary,
        featured,
        latest: rest.filter((article) => !usedIds.has(article.id)).slice(0, 6),
        bySection,
        totalArticles: summaries.length,
    }
}

/** Same section first, then anything else recent, so the slot is never empty. */
export async function getRelatedArticles(article: ArticleSummary, limit = 3): Promise<ArticleSummary[]> {
    const summaries = (await getPublishedArticles()).map(toSummary).filter((item) => item.id !== article.id)

    const sameSection = summaries.filter((item) => item.section === article.section)
    const others = summaries.filter((item) => item.section !== article.section)

    return [...sameSection, ...others].slice(0, limit)
}

export async function getPublishedPage(slug: string): Promise<PageContent | null> {
    const page = await getStore().getPageBySlug(slug)
    return page && page.status === "published" ? page : null
}

export async function getPublishedPages(): Promise<PageContent[]> {
    const pages = await getStore().listPages()
    return pages.filter((page) => page.status === "published")
}

export async function getSiteSettings(): Promise<SiteSettings> {
    return getStore().getSettings()
}
