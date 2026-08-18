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
 * Homepage composition. The page leads on news and editor-featured stories rather than
 * showing every section, so the rest of the site is reached through the navigation and
 * the section links at the foot of the page.
 */
export interface HomepageContent {
    settings: SiteSettings
    lead: ArticleSummary | null
    secondary: ArticleSummary[]
    featured: ArticleSummary[]
    latestNews: ArticleSummary[]
    sections: { section: ArticleSection; label: string; subtitle: string; href: string; count: number }[]
    totalArticles: number
}

export async function getHomepageContent(): Promise<HomepageContent> {
    const store = getStore()
    const [articles, settings] = await Promise.all([getPublishedArticles(), store.getSettings()])
    const summaries = articles.map(toSummary)

    const featuredAll = summaries.filter((article) => article.featured)
    const pinned = settings.heroArticleId
        ? summaries.find((article) => article.id === settings.heroArticleId)
        : undefined

    // Pinned choice wins, then the newest featured story, then simply the newest article.
    const lead = pinned || featuredAll[0] || summaries[0] || null

    const used = new Set<string>(lead ? [lead.id] : [])

    // The two slots beside the lead prefer other featured stories, then the newest news.
    // Deduplicate with a local set: marking `used` here would consume every candidate
    // before the slice, leaving the featured and news blocks below empty.
    const seen = new Set(used)
    const secondary = [...featuredAll, ...summaries.filter((article) => article.section === "news"), ...summaries]
        .filter((article) => {
            if (seen.has(article.id)) return false
            seen.add(article.id)
            return true
        })
        .slice(0, 2)

    secondary.forEach((article) => used.add(article.id))

    const featured = featuredAll.filter((article) => !used.has(article.id)).slice(0, 3)
    featured.forEach((article) => used.add(article.id))

    const latestNews = summaries
        .filter((article) => article.section === "news" && !used.has(article.id))
        .slice(0, 6)

    const sections = (Object.keys(SECTION_META) as ArticleSection[])
        .filter((section) => section !== "news")
        .map((section) => ({
            section,
            label: SECTION_META[section].label,
            subtitle: SECTION_META[section].subtitle,
            href: `/${section}`,
            count: summaries.filter((article) => article.section === section).length,
        }))
        .filter((group) => group.count > 0)

    return {
        settings,
        lead,
        secondary,
        featured,
        latestNews,
        sections,
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
