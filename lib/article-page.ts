import "server-only"

import type { Metadata } from "next"

import { getArticleDetail, getSectionArticles } from "@/lib/content"
import type { ArticleSection } from "@/lib/types"

/**
 * Pre-renders the article routes that exist at build time. Anything published later is
 * still served — `dynamicParams` defaults to true — so the CMS is never blocked by the build.
 */
export async function generateSectionStaticParams(section: ArticleSection) {
    try {
        const articles = await getSectionArticles(section)
        return articles.map((article) => ({ slug: article.slug }))
    } catch {
        // A missing CMS connection at build time must not fail the whole build.
        return []
    }
}

export async function buildArticleMetadata(section: ArticleSection, slug: string): Promise<Metadata> {
    const article = await getArticleDetail(section, slug)

    if (!article) {
        return { title: "Article not found" }
    }

    return {
        title: article.title,
        description: article.excerpt,
        alternates: { canonical: article.href },
        openGraph: {
            type: "article",
            title: article.title,
            description: article.excerpt,
            publishedTime: article.publishedAt,
            authors: [article.author],
            images: article.imageUrl ? [{ url: article.imageUrl }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: article.title,
            description: article.excerpt,
            images: article.imageUrl ? [article.imageUrl] : undefined,
        },
    }
}
