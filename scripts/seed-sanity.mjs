/**
 * Copies the starter content into a Sanity dataset, so a freshly deployed site is not
 * empty on its first visit.
 *
 * Usage:
 *   NEXT_PUBLIC_SANITY_PROJECT_ID=... SANITY_API_WRITE_TOKEN=... npm run seed:sanity
 *
 * Safe to re-run: documents are replaced by id rather than duplicated.
 */

import { createClient } from "@sanity/client"

import { buildArticles, demoPages, demoSettings } from "./demo-content.mjs"

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"
const token = process.env.SANITY_API_WRITE_TOKEN

if (!projectId || !token) {
    console.error("Missing configuration.\n")
    console.error("Set NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_WRITE_TOKEN, then run again.")
    console.error("Both are available in your Sanity project settings at sanity.io/manage.")
    process.exit(1)
}

const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-12-27",
    useCdn: false,
})

const articles = buildArticles()
const transaction = client.transaction()

for (const article of articles) {
    transaction.createOrReplace({
        _id: `article-${article.id}`,
        _type: "article",
        title: article.title,
        slug: { _type: "slug", current: article.slug },
        excerpt: article.excerpt,
        content: article.content,
        category: article.category,
        section: article.section,
        author: article.author,
        publishedAt: article.publishedAt,
        readTime: article.readTime,
        imageUrl: article.imageUrl,
        imageAlt: article.imageAlt,
        imageCredit: article.imageCredit,
        status: article.status,
        featured: article.featured,
    })
}

for (const page of demoPages) {
    transaction.createOrReplace({
        _id: `page-${page.id}`,
        _type: "page",
        title: page.title,
        slug: { _type: "slug", current: page.slug },
        excerpt: page.excerpt,
        content: page.content,
        status: page.status,
    })
}

transaction.createOrReplace({
    _id: "siteSettings",
    _type: "siteSettings",
    ...demoSettings,
})

try {
    await transaction.commit()
    console.log(`Seeded ${articles.length} articles, ${demoPages.length} pages, and site settings into "${dataset}".`)
    console.log("Open your site — the content is live.")
} catch (error) {
    console.error("Seeding failed:", error.message)
    console.error("Check that the token has write (Editor) permission for this dataset.")
    process.exit(1)
}
