import type { ImageSource } from "@/sanity/lib/image"

export const ARTICLE_SECTIONS = [
    "news",
    "reviews",
    "how-to",
    "how-stuff-works",
    "tech-kenya",
] as const

export type ArticleSection = (typeof ARTICLE_SECTIONS)[number]

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
}

export interface PageContent {
    id: string
    title: string
    slug: string
    status: "draft" | "published"
    excerpt: string
    content: string
    updatedAt: string
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
    readTime?: string
    author?: string
    body?: unknown[]
}
