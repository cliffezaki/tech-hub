import type { ImageSource } from "@/sanity/lib/image"

export const ARTICLE_SECTIONS = [
    "news",
    "reviews",
    "how-to",
    "how-stuff-works",
    "tech-kenya",
] as const

export type ArticleSection = (typeof ARTICLE_SECTIONS)[number]

export const SECTION_META: Record<
    ArticleSection,
    { label: string; navLabel: string; title: string; subtitle: string; defaultCategory: string }
> = {
    news: {
        label: "News",
        navLabel: "News",
        title: "Latest News",
        subtitle: "Breaking stories from the world of technology",
        defaultCategory: "News",
    },
    reviews: {
        label: "Reviews",
        navLabel: "Reviews",
        title: "Reviews",
        subtitle: "Hands-on verdicts on the hardware worth your money",
        defaultCategory: "Review",
    },
    "how-to": {
        label: "How To",
        navLabel: "How To",
        title: "How To",
        subtitle: "Practical, step-by-step guides you can follow today",
        defaultCategory: "Guide",
    },
    "how-stuff-works": {
        label: "How Stuff Works",
        navLabel: "How Stuff Works",
        title: "How Stuff Works",
        subtitle: "The science and engineering behind the headlines",
        defaultCategory: "Explainer",
    },
    "tech-kenya": {
        label: "Tech Kenya",
        navLabel: "Tech Kenya",
        title: "Tech Kenya",
        subtitle: "Technology, startups, and infrastructure across Kenya",
        defaultCategory: "Tech Kenya",
    },
}

export type ArticleStatus = "draft" | "published"

export interface Article {
    id: string
    title: string
    slug: string
    excerpt: string
    content: string
    category: string
    section: ArticleSection
    author: string
    publishedAt: string
    readTime: string
    imageUrl?: string
    imageAlt?: string
    imageCredit?: string
    status: ArticleStatus
    featured: boolean
    updatedAt?: string
}

export interface PageContent {
    id: string
    title: string
    slug: string
    status: ArticleStatus
    excerpt: string
    content: string
    updatedAt: string
}

export interface MediaItem {
    id: string
    url: string
    filename: string
    uploadedAt: string
    /** Only present for locally stored uploads; Sanity assets are removed by id. */
    size?: number
}

export interface SiteSettings {
    siteName: string
    tagline: string
    heroEyebrow: string
    heroTitle: string
    heroSubtitle: string
    /** Article id to pin as the lead story. Empty means "use the newest featured article". */
    heroArticleId: string
    newsletterTitle: string
    newsletterText: string
    footerText: string
    contactEmail: string
    twitterUrl: string
    linkedinUrl: string
    youtubeUrl: string
}

export const DEFAULT_SETTINGS: SiteSettings = {
    siteName: "Tech Hub",
    tagline: "Technology news, reviews, and guides",
    heroEyebrow: "Today's lead story",
    heroTitle: "",
    heroSubtitle: "",
    heroArticleId: "",
    newsletterTitle: "Tech Hub Weekly",
    newsletterText: "Get the future in your inbox. No spam, just signal.",
    footerText: "Independent technology journalism from Nairobi and beyond.",
    contactEmail: "hello@techhub.co.ke",
    twitterUrl: "",
    linkedinUrl: "",
    youtubeUrl: "",
}

export interface ArticleSummary {
    id: string
    title: string
    slug: string
    excerpt: string
    category: string
    section: ArticleSection
    author: string
    publishedAt: string
    readTime: string
    href: string
    imageUrl?: string
    imageAlt?: string
    featured: boolean
}

export interface SanityArticle {
    _id: string
    title?: string
    slug?: string
    excerpt?: string
    category?: string
    section?: ArticleSection
    publishedAt?: string
    mainImage?: ImageSource
    imageUrl?: string
    imageAlt?: string
    imageCredit?: string
    readTime?: string
    author?: string
    content?: string
    status?: ArticleStatus
    featured?: boolean
    body?: unknown[]
}
