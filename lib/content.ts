import { readPlacements, withPlacements } from "@/lib/placement-store"
import { pinnedFirst } from "@/lib/placements"
import "server-only"
import { cache } from "react"
import { articleVisible } from "@/lib/article-visibility"

import { getStore } from "@/lib/store"
import { BUILTIN_PAGES, mergeBuiltinPages } from "@/lib/builtin-pages"
import { SECTION_META } from "@/lib/types"
import type {
    Article,
    ArticleSection,
    ArticleSummary,
    PageContent,
    SiteSettings,
} from "@/lib/types"

export interface ArticleDetail extends ArticleSummary {
    content: string
    imageCredit?: string
}

// Reviewed excerpts from the existing published article, used until CMS facts are supplied.
// Only retain a fact while its supporting wording remains in the article.
function reviewedLeadFacts(article: Article): string[] {
    if (article.slug !== "apple-m6-macbook-pro-worth-it") return []
    const facts = [
        ["12-core CPU and a 12-core GPU", "12-core CPU and 12-core GPU."],
        ["Wi-Fi 7 only helps when your router supports it", "Wi-Fi 7 requires a compatible router."],
        ["three Thunderbolt 4 ports", "Three Thunderbolt 4 ports, HDMI and an SD card slot."],
        ["screen, camera and speakers are the same", "Screen, camera and speakers are unchanged."],
        ["The M6 begins at that same price", "Starts at $1,999 with 1TB of storage."],
        ["M5 owners should stay where they are", "M5 owners have little reason to upgrade."],
    ]
    return facts.filter(([source]) => article.content.includes(source)).map(([, fact]) => fact)
}

function toSummary(article: Article): ArticleSummary {
    return {
        pinnedAreas: article.pinnedAreas,
        demo: article.demo,
        mobileHeadline: article.mobileHeadline, titleBold: article.titleBold, titleItalic: article.titleItalic, titleFont: article.titleFont, titleSize: article.titleSize,
        seoTitle: article.seoTitle,
        metaDescription: article.metaDescription,
        tags: article.tags,
        quickFacts: article.quickFacts?.length ? article.quickFacts : reviewedLeadFacts(article),
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
        sponsorship: article.sponsorship,
    }
}

function isPublished(article: Article) {
    return articleVisible(article)
}

/** Every public read goes through here, so drafts can never leak onto the live site. */
const getPublishedArticles = cache(async (): Promise<Article[]> => {
    const articles = await getStore().listArticles(false)
    const placements = await readPlacements()
    return articles.map(a=>withPlacements(a,placements)).filter(isPublished).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
})

export async function getSectionArticles(
    section: ArticleSection
): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    const sectionArticles = articles.filter(a=>a.section === section)
    const ordered = pinnedFirst(sectionArticles, `${section}:latest`)
    const hero = sectionArticles.find(a=>a.pinnedAreas?.includes(`${section}:featured`))
    return (hero ? [hero,...ordered.filter(a=>a.id!==hero.id)] : ordered).map(toSummary)
}

export async function getLatestArticles(limit = 12): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    return articles.slice(0, limit).map(toSummary)
}

export async function getAllArticleSummaries(): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    return articles.map(toSummary)
}

/** Recent, published editorial headlines; section pages stay within their section. */
export async function getTickerArticles(section?: ArticleSection): Promise<ArticleSummary[]> {
    const now = Date.now()
    return (await getPublishedArticles())
        .filter(article => {
            const age = now - Date.parse(article.publishedAt)
            return !article.demo && (!section || article.section === section)
                && age >= 0 && age <= 30 * 86400000
        })
        .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
        .slice(0, 6)
        .map(toSummary)
}

export async function getArticleDetail(
    section: ArticleSection,
    slug: string
): Promise<ArticleDetail | null> {
    const article = await getStore().getArticleBySlug(slug, false)

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
    related?: ArticleSummary
    latestNews: ArticleSummary[]
    sections: {
        section: ArticleSection
        label: string
        subtitle: string
        href: string
        count: number
    }[]
    reviews: ArticleSummary[]
    ticker: ArticleSummary[]
    newsCount: number
}

export async function getHomepageContent(): Promise<HomepageContent> {
    const store = getStore()
    const [articles, settings] = await Promise.all([
        getPublishedArticles(),
        store.getSettings(),
    ])
    const summaries = articles.map(toSummary)
    const placements = await readPlacements()
    const featuredAll = pinnedFirst(summaries, "homepage:featured").filter(a=>a.featured)
    const lead = summaries.find(a=>a.pinnedAreas?.includes("homepage")) || featuredAll[0] || summaries[0] || null
    const used = new Set<string>(lead ? [lead.id] : [])

    const priorId = placements.lastLead && placements.lastLead !== lead?.id ? placements.lastLead : placements.previousLead
    const prior = priorId ? summaries.find(a=>a.id===priorId && a.id!==lead?.id) : undefined
    const manualAlso = summaries.find(a=>a.id!==lead?.id && a.pinnedAreas?.includes("homepage:also"))
    const secondary = [manualAlso || prior || summaries.find(a=>a.id!==lead?.id)].filter((a):a is ArticleSummary=>!!a)

    secondary.forEach((article) => used.add(article.id))

    const reservedNews = new Set(summaries.filter(a => !used.has(a.id) && !a.featured && (a.section === "news" || (a.section === "tech-kenya" && a.category.toLowerCase() === "news"))).sort((a,b) => Number(b.section === "news") - Number(a.section === "news")).slice(0,5).map(a => a.id))
    const featureSeen = new Set(used)
    const featured = [...featuredAll, ...summaries.filter(a=>!reservedNews.has(a.id) && !a.pinnedAreas?.includes("homepage:reviews"))].filter(article => {
        if (featureSeen.has(article.id)) return false
        featureSeen.add(article.id)
        return true
    }).slice(0, 4)
    featured.forEach((article) => used.add(article.id))

    const news = pinnedFirst(summaries, "news:latest").filter((article) => article.section === "news")
    const additionalNews = summaries.filter(a => a.section === "tech-kenya" && a.category.toLowerCase() === "news")
    const latestNews = [...news, ...additionalNews]
        .filter((article) => !used.has(article.id))
        .slice(0, 5)

    latestNews.forEach(article => used.add(article.id))
    const reviews = pinnedFirst(summaries.filter(a => a.section === "reviews" && !used.has(a.id)), "homepage:reviews").slice(0, 4)
    reviews.forEach(article => used.add(article.id))
    const phoneCoverage = /\b(phone|phones|smartphone|iphone|android|xiaomi|galaxy)\b/i
    const related = lead && summaries.find(article => !used.has(article.id) && (
        article.tags?.some(tag => lead.tags?.includes(tag)) ||
        (article.category === lead.category && !["News", "Reviews"].includes(article.category)) ||
        (phoneCoverage.test(lead.title + " " + lead.excerpt) && phoneCoverage.test(article.title))
    ))

    const sections = (Object.keys(SECTION_META) as ArticleSection[])
        .filter((section) => section !== "news")
        .map((section) => ({
            section,
            label: SECTION_META[section].label,
            subtitle: SECTION_META[section].subtitle,
            href: `/${section}`,
            count: summaries.filter((article) => article.section === section)
                .length,
        }))
        .filter((group) => group.count > 0)

    return {
        settings,
        lead,
        secondary,
        featured,
        related,
        latestNews,
        sections,
        newsCount: news.length,
        reviews,
        ticker: await getTickerArticles(),
    }
}

/** Same section first, then anything else recent, so the slot is never empty. */
export async function getRelatedArticles(
    article: ArticleSummary,
    limit = 3
): Promise<ArticleSummary[]> {
    const summaries = (await getPublishedArticles())
        .map(toSummary)
        .filter((item) => item.id !== article.id)

    const tags = new Set((article.tags || []).map(tag => tag.toLowerCase()))
    const score = (item: ArticleSummary) => (item.tags || []).reduce((n, tag) => n + (tags.has(tag.toLowerCase()) ? 4 : 0), 0) + (item.category === article.category ? 3 : 0) + (item.section === article.section ? 1 : 0)
    return summaries.filter(item => score(item) > 0).sort((a,b) => score(b) - score(a) || Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, limit)
}

export async function getPublishedPage(
    slug: string
): Promise<PageContent | null> {
    const page =
        (await getStore().getPageBySlug(slug, false)) ||
        BUILTIN_PAGES.find((p) => p.slug === slug)
    return page && page.status === "published" ? page : null
}

export async function getPublishedPages(): Promise<PageContent[]> {
    const pages = await getStore().listPages(false)
    return mergeBuiltinPages(pages).filter(
        (page) => page.status === "published"
    )
}

export async function getSiteSettings(): Promise<SiteSettings> {
    return getStore().getSettings()
}
