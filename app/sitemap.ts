import type { MetadataRoute } from "next"

import { getAllArticleSummaries, getPublishedPages } from "@/lib/content"
import { getSiteUrl } from "@/lib/site"
import { ARTICLE_SECTIONS } from "@/lib/types"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const baseUrl = getSiteUrl()

    const staticRoutes: MetadataRoute.Sitemap = [
        { url: baseUrl, changeFrequency: "hourly", priority: 1 },
        { url: `${baseUrl}/search`, changeFrequency: "weekly", priority: 0.3 },
        { url: `${baseUrl}/contact`, changeFrequency: "yearly", priority: 0.3 },
        ...ARTICLE_SECTIONS.map((section) => ({
            url: `${baseUrl}/${section}`,
            changeFrequency: "daily" as const,
            priority: 0.8,
        })),
    ]

    try {
        const [articles, pages] = await Promise.all([getAllArticleSummaries(), getPublishedPages()])

        return [
            ...staticRoutes,
            ...articles.map((article) => ({
                url: `${baseUrl}${article.href}`,
                lastModified: new Date(article.publishedAt),
                changeFrequency: "weekly" as const,
                priority: 0.7,
            })),
            ...pages.map((page) => ({
                url: `${baseUrl}/${page.slug}`,
                lastModified: new Date(page.updatedAt),
                changeFrequency: "monthly" as const,
                priority: 0.5,
            })),
        ]
    } catch {
        return staticRoutes
    }
}
