import { client } from "@/sanity/lib/client"
import { urlForImage } from "@/sanity/lib/image"
import { projectId } from "@/sanity/env"
import { getArticleBySlug, getArticles } from "@/lib/articles"
import { MOCK_DATA } from "@/lib/mock-data"
import type { Article, ArticleSection, ArticleSummary, SanityArticle } from "@/lib/types"

interface MockArticle {
    id?: string | number
    title: string
    slug?: string
    excerpt?: string
    description?: string
    category?: string
    author?: string
    readTime?: string
    date?: string
    imageUrl?: string
}

export interface ArticleDetail {
    id: string
    title: string
    slug: string
    excerpt: string
    category: string
    section: ArticleSection
    author: string
    publishedAt: string
    readTime: string
    imageUrl?: string
    content?: string
    body?: unknown[]
}

const SECTION_LABELS: Record<ArticleSection, string> = {
    news: "News",
    reviews: "Review",
    "how-to": "Guide",
    "how-stuff-works": "Explainer",
    "tech-kenya": "Tech Kenya",
}

const FALLBACK_BY_SECTION: Record<ArticleSection, MockArticle[]> = {
    news: [
        { ...MOCK_DATA.featuredNews, slug: "next-generation-generative-models" },
        ...MOCK_DATA.topStories,
        ...MOCK_DATA.aiNews,
        ...MOCK_DATA.gridNews,
    ],
    reviews: [...MOCK_DATA.smartphoneReviews, ...MOCK_DATA.reviews],
    "how-to": MOCK_DATA.howTo,
    "how-stuff-works": MOCK_DATA.howStuffWorks,
    "tech-kenya": MOCK_DATA.techKenya,
}

export function slugify(text: string) {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
}

function isSanityConfigured() {
    return Boolean(projectId && projectId !== "your-project-id")
}

function shouldPreferSanity() {
    return process.env.CONTENT_SOURCE === "sanity" || process.env.NEXT_PUBLIC_CONTENT_SOURCE === "sanity"
}

function getHref(section: ArticleSection, slug: string) {
    return `/${section}/${slug}`
}

function fromLocalArticle(article: Article): ArticleSummary {
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
        href: getHref(article.section, article.slug),
        imageUrl: article.imageUrl,
    }
}

function fromSanityArticle(article: SanityArticle, section: ArticleSection): ArticleSummary {
    const slug = article.slug || slugify(article.title || "untitled")

    return {
        id: article._id,
        title: article.title || "Untitled article",
        slug,
        excerpt: article.excerpt || "No summary has been added yet.",
        category: article.category || SECTION_LABELS[section],
        section,
        author: article.author || "Tech Hub Staff",
        publishedAt: article.publishedAt || new Date().toISOString(),
        readTime: article.readTime || "5 min read",
        href: getHref(section, slug),
        imageUrl: article.mainImage ? urlForImage(article.mainImage).url() : undefined,
    }
}

function fromMockArticle(article: MockArticle, section: ArticleSection, index: number): ArticleSummary {
    const slug = article.slug || slugify(article.title)

    return {
        id: `${section}-${article.id || index}`,
        title: article.title,
        slug,
        excerpt: article.excerpt || article.description || "Full article coming soon.",
        category: article.category || SECTION_LABELS[section],
        section,
        author: article.author || "Tech Hub Staff",
        publishedAt: new Date().toISOString(),
        readTime: article.readTime || "5 min read",
        href: getHref(section, slug),
        imageUrl: article.imageUrl,
    }
}

async function getSanityArticles(section: ArticleSection): Promise<ArticleSummary[]> {
    if (!isSanityConfigured()) {
        return []
    }

    const query = `*[_type == "article" && section == $section] | order(publishedAt desc) {
        _id,
        title,
        excerpt,
        category,
        section,
        publishedAt,
        mainImage,
        readTime,
        author,
        "slug": slug.current
    }`

    try {
        const articles = await client.fetch<SanityArticle[]>(query, { section })
        return articles.map((article) => fromSanityArticle(article, section))
    } catch (error) {
        console.warn(`Sanity ${section} fetch failed:`, error)
        return []
    }
}

export async function getSectionArticles(section: ArticleSection): Promise<ArticleSummary[]> {
    if (shouldPreferSanity()) {
        const sanityArticles = await getSanityArticles(section)
        if (sanityArticles.length > 0) {
            return sanityArticles
        }
    }

    const localArticles = (await getArticles())
        .filter((article) => article.section === section)
        .map(fromLocalArticle)

    if (localArticles.length > 0) {
        return localArticles
    }

    const sanityArticles = await getSanityArticles(section)
    if (sanityArticles.length > 0) {
        return sanityArticles
    }

    return FALLBACK_BY_SECTION[section].map((article, index) => fromMockArticle(article, section, index))
}

export async function getHomepageReviews() {
    const reviews = await getSectionArticles("reviews")
    return reviews.filter((article) => article.category === "Smartphone" || article.category === "Review").slice(0, 4)
}

async function getSanityArticleBySlug(section: ArticleSection, slug: string): Promise<ArticleDetail | null> {
    if (!isSanityConfigured()) {
        return null
    }

    const query = `*[_type == "article" && section == $section && slug.current == $slug][0] {
        _id,
        title,
        excerpt,
        category,
        section,
        publishedAt,
        mainImage,
        readTime,
        author,
        body,
        "slug": slug.current
    }`

    try {
        const article = await client.fetch<SanityArticle | null>(query, { section, slug })
        if (!article) {
            return null
        }

        const summary = fromSanityArticle(article, section)
        return {
            ...summary,
            body: article.body,
        }
    } catch (error) {
        console.warn(`Sanity article fetch failed for ${slug}:`, error)
        return null
    }
}

export async function getArticleDetail(section: ArticleSection, slug: string): Promise<ArticleDetail | null> {
    if (shouldPreferSanity()) {
        const sanityArticle = await getSanityArticleBySlug(section, slug)
        if (sanityArticle) {
            return sanityArticle
        }
    }

    const localArticle = await getArticleBySlug(slug)
    if (localArticle && localArticle.section === section) {
        return {
            ...fromLocalArticle(localArticle),
            content: localArticle.content,
        }
    }

    const sanityArticle = await getSanityArticleBySlug(section, slug)
    if (sanityArticle) {
        return sanityArticle
    }

    const fallback = FALLBACK_BY_SECTION[section].find((article) => {
        const fallbackSlug = article.slug || slugify(article.title)
        return fallbackSlug === slug
    })

    if (!fallback) {
        return null
    }

    return {
        ...fromMockArticle(fallback, section, 0),
        content: `${fallback.excerpt || fallback.description || "Full article coming soon."}\n\nThis is fallback content. Add a full article from the admin CMS or Sanity Studio to replace it.`,
    }
}
