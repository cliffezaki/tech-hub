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
        ["12-core CPU and a 12-core GPU", "The article lists a 12-core CPU and a 12-core GPU."],
        ["Wi-Fi 7 only helps when your router supports it", "Wi-Fi 7 needs a compatible router to deliver its benefits."],
        ["three Thunderbolt 4 ports", "The port selection includes three Thunderbolt 4 ports, HDMI and an SD card slot."],
        ["screen, camera and speakers are the same", "The screen, camera and speakers remain unchanged from the previous model."],
    ]
    return facts.filter(([source]) => article.content.includes(source)).map(([, fact]) => fact)
}

function toSummary(article: Article): ArticleSummary {
    return {
        demo: article.demo,
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
    return articles.filter(isPublished).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
})

export async function getSectionArticles(
    section: ArticleSection
): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    return articles
        .filter((article) => article.section === section)
        .sort(
            (a, b) =>
                Number(
                    b.pinnedAreas?.includes(section) ||
                        b.pinnedAreas?.includes(b.category)
                ) -
                    Number(
                        a.pinnedAreas?.includes(section) ||
                            a.pinnedAreas?.includes(a.category)
                    ) || (a.manualOrder || 0) - (b.manualOrder || 0)
        )
        .map(toSummary)
}

export async function getLatestArticles(limit = 12): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    return articles.slice(0, limit).map(toSummary)
}

export async function getAllArticleSummaries(): Promise<ArticleSummary[]> {
    const articles = await getPublishedArticles()
    return articles.map(toSummary)
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
    articles.sort(
        (a, b) =>
            Number(b.pinnedAreas?.includes("homepage")) -
                Number(a.pinnedAreas?.includes("homepage")) ||
            (a.manualOrder || 0) - (b.manualOrder || 0)
    )
    const summaries = articles.map(toSummary)

    const featuredAll = summaries.filter((article) => article.featured)
    const pinned = settings.heroArticleId
        ? summaries.find((article) => article.id === settings.heroArticleId)
        : summaries.find((summary) =>
              articles
                  .find((article) => article.id === summary.id)
                  ?.pinnedAreas?.includes("homepage")
          )

    // Pinned choice wins, then the newest featured story, then simply the newest article.
    const lead = pinned || featuredAll[0] || summaries[0] || null

    const used = new Set<string>(lead ? [lead.id] : [])

    // The two slots beside the lead prefer other featured stories, then the newest news.
    // Deduplicate with a local set: marking `used` here would consume every candidate
    // before the slice, leaving the featured and news blocks below empty.
    const seen = new Set(used)
    const secondary = [
        ...featuredAll,
        ...summaries.filter((article) => article.section === "news"),
        ...summaries,
    ]
        .filter((article) => {
            if (seen.has(article.id)) return false
            seen.add(article.id)
            return true
        })
        .slice(0, 2)

    secondary.forEach((article) => used.add(article.id))

    const featureSeen = new Set(used)
    const featured = [...featuredAll, ...summaries].filter(article => {
        if (featureSeen.has(article.id)) return false
        featureSeen.add(article.id)
        return true
    }).slice(0, 4)
    featured.forEach((article) => used.add(article.id))

    const news = summaries.filter((article) => article.section === "news")
    const latestNews = news
        .filter((article) => !used.has(article.id))
        .slice(0, 6)

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
        latestNews,
        sections,
        newsCount: news.length,
        reviews: summaries.filter(a => a.section === "reviews").sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0,4),
        ticker: summaries.filter(a => !a.demo && Date.now() - Date.parse(a.publishedAt) <= 7 * 86400000)
            .sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, 6),
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
