import "server-only"

import type { Metadata } from "next"

import { getArticleDetail, getSectionArticles, getSiteSettings } from "@/lib/content"
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

    const settings = await getSiteSettings()
    const image = article.imageUrl || settings.socialImage
    return {
        title: article.seoTitle || article.title,
        description: article.metaDescription || article.excerpt,
        keywords: article.tags,
        alternates: { canonical: article.href },
        openGraph: {
            type: "article",
            title: article.seoTitle || article.title,
            description: article.metaDescription || article.excerpt,
            publishedTime: article.publishedAt,
            authors: [article.author],
            images: image ? [{ url: image }] : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: article.seoTitle || article.title,
            description: article.metaDescription || article.excerpt,
            images: image ? [image] : undefined,
        },
    }
}
