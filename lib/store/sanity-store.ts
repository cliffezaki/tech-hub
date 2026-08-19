import { createClient } from "next-sanity"
import type { SanityClient } from "next-sanity"

import { apiVersion, dataset, projectId, writeToken } from "@/sanity/env"
import { urlForImage } from "@/sanity/lib/image"
import { DEFAULT_SETTINGS } from "@/lib/types"
import type { Article, MediaItem, PageContent, SiteSettings } from "@/lib/types"
import { generateId, normalizeArticle, normalizePage, normalizeSettings, slugify } from "./normalize"
import type { ContentStore, UploadInput } from "./types"

const SETTINGS_DOC_ID = "siteSettings"

const ARTICLE_PROJECTION = `{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    content,
    category,
    section,
    author,
    publishedAt,
    readTime,
    imageUrl,
    imageAlt,
    imageCredit,
    mainImage,
    status,
    featured,
    _updatedAt
}`

const PAGE_PROJECTION = `{
    _id,
    title,
    "slug": slug.current,
    excerpt,
    content,
    status,
    _updatedAt
}`

interface SanityArticleDoc {
    _id: string
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    category?: string
    section?: string
    author?: string
    publishedAt?: string
    readTime?: string
    imageUrl?: string
    imageAlt?: string
    imageCredit?: string
    mainImage?: unknown
    status?: string
    featured?: boolean
    _updatedAt?: string
}

interface SanityPageDoc {
    _id: string
    title?: string
    slug?: string
    excerpt?: string
    content?: string
    status?: string
    _updatedAt?: string
}

function toArticle(doc: SanityArticleDoc): Article {
    // Uploads made from the dashboard store a plain CDN url; documents authored in
    // Sanity Studio use a `mainImage` reference, so both are resolved here.
    let imageUrl = doc.imageUrl
    if (!imageUrl && doc.mainImage) {
        try {
            imageUrl = urlForImage(doc.mainImage as Parameters<typeof urlForImage>[0]).url()
        } catch {
            imageUrl = undefined
        }
    }

    return normalizeArticle({
        ...doc,
        id: doc._id,
        imageUrl,
        updatedAt: doc._updatedAt,
    })
}

function toPage(doc: SanityPageDoc): PageContent {
    return normalizePage({
        ...doc,
        id: doc._id,
        updatedAt: doc._updatedAt,
    })
}

function toDocFields(input: Partial<Article>) {
    const fields: Record<string, unknown> = {}
    const assign = (key: string, value: unknown) => {
        if (value !== undefined) {
            fields[key] = value
        }
    }

    assign("title", input.title)
    assign("excerpt", input.excerpt)
    assign("content", input.content)
    assign("category", input.category)
    assign("section", input.section)
    assign("author", input.author)
    assign("publishedAt", input.publishedAt)
    assign("readTime", input.readTime)
    assign("imageUrl", input.imageUrl ?? null)
    assign("imageAlt", input.imageAlt ?? null)
    assign("imageCredit", input.imageCredit ?? null)
    assign("status", input.status)
    assign("featured", input.featured)

    if (input.slug) {
        fields.slug = { _type: "slug", current: slugify(input.slug) }
    }

    return fields
}

export function createSanityStore(): ContentStore {
    const readClient: SanityClient = createClient({
        projectId,
        dataset,
        apiVersion,
        useCdn: false,
        perspective: "published",
    })

    const writeClient = writeToken ? readClient.withConfig({ token: writeToken }) : null

    function requireWriteClient(): SanityClient {
        if (!writeClient) {
            throw new Error(
                "Sanity write token is missing. Add SANITY_API_WRITE_TOKEN to your environment to save changes."
            )
        }

        return writeClient
    }

    /**
     * A misconfigured or momentarily unreachable Sanity project must not take the whole
     * site down. Public reads fall back to an empty/default value and log the real cause
     * to the server console (visible in Vercel's function logs); only writes are allowed
     * to throw, since those already surface as a clear error in the dashboard.
     */
    async function safeRead<T>(label: string, fallback: T, run: () => Promise<T>): Promise<T> {
        try {
            return await run()
        } catch (error) {
            console.error(`Sanity read failed (${label}):`, error)
            return fallback
        }
    }

    return {
        mode: "sanity",
        writable: Boolean(writeToken),

        async listArticles() {
            return safeRead("listArticles", [], async () => {
                const docs = await readClient.fetch<SanityArticleDoc[]>(
                    `*[_type == "article"] | order(publishedAt desc) ${ARTICLE_PROJECTION}`
                )
                return docs.map(toArticle)
            })
        },

        async getArticle(id) {
            return safeRead("getArticle", null, async () => {
                const doc = await readClient.fetch<SanityArticleDoc | null>(
                    `*[_type == "article" && _id == $id][0] ${ARTICLE_PROJECTION}`,
                    { id }
                )
                return doc ? toArticle(doc) : null
            })
        },

        async getArticleBySlug(slug) {
            return safeRead("getArticleBySlug", null, async () => {
                const doc = await readClient.fetch<SanityArticleDoc | null>(
                    `*[_type == "article" && slug.current == $slug][0] ${ARTICLE_PROJECTION}`,
                    { slug }
                )
                return doc ? toArticle(doc) : null
            })
        },

        async createArticle(input) {
            const client = requireWriteClient()
            const created = await client.create({
                _type: "article",
                ...toDocFields({ ...input, slug: input.slug || input.title }),
            })

            return toArticle(created as unknown as SanityArticleDoc)
        },

        async updateArticle(id, patch) {
            const client = requireWriteClient()
            const existing = await this.getArticle(id)
            if (!existing) {
                return null
            }

            await client.patch(id).set(toDocFields(patch)).commit()
            return this.getArticle(id)
        },

        async deleteArticle(id) {
            const client = requireWriteClient()
            const existing = await this.getArticle(id)
            if (!existing) {
                return false
            }

            await client.delete(id)
            return true
        },

        async listPages() {
            return safeRead("listPages", [], async () => {
                const docs = await readClient.fetch<SanityPageDoc[]>(
                    `*[_type == "page"] | order(_updatedAt desc) ${PAGE_PROJECTION}`
                )
                return docs.map(toPage)
            })
        },

        async getPage(id) {
            return safeRead("getPage", null, async () => {
                const doc = await readClient.fetch<SanityPageDoc | null>(
                    `*[_type == "page" && _id == $id][0] ${PAGE_PROJECTION}`,
                    { id }
                )
                return doc ? toPage(doc) : null
            })
        },

        async getPageBySlug(slug) {
            return safeRead("getPageBySlug", null, async () => {
                const doc = await readClient.fetch<SanityPageDoc | null>(
                    `*[_type == "page" && slug.current == $slug][0] ${PAGE_PROJECTION}`,
                    { slug }
                )
                return doc ? toPage(doc) : null
            })
        },

        async createPage(input) {
            const client = requireWriteClient()
            const created = await client.create({
                _type: "page",
                title: input.title,
                slug: { _type: "slug", current: slugify(input.slug || input.title) },
                excerpt: input.excerpt,
                content: input.content,
                status: input.status,
            })

            return toPage(created as unknown as SanityPageDoc)
        },

        async updatePage(id, patch) {
            const client = requireWriteClient()
            const existing = await this.getPage(id)
            if (!existing) {
                return null
            }

            const fields: Record<string, unknown> = {}
            if (patch.title !== undefined) fields.title = patch.title
            if (patch.excerpt !== undefined) fields.excerpt = patch.excerpt
            if (patch.content !== undefined) fields.content = patch.content
            if (patch.status !== undefined) fields.status = patch.status
            if (patch.slug !== undefined) fields.slug = { _type: "slug", current: slugify(patch.slug) }

            await client.patch(id).set(fields).commit()
            return this.getPage(id)
        },

        async deletePage(id) {
            const client = requireWriteClient()
            const existing = await this.getPage(id)
            if (!existing) {
                return false
            }

            await client.delete(id)
            return true
        },

        async getSettings() {
            return safeRead("getSettings", { ...DEFAULT_SETTINGS }, async () => {
                const doc = await readClient.fetch<Partial<SiteSettings> | null>(
                    `*[_type == "siteSettings" && _id == $id][0]`,
                    { id: SETTINGS_DOC_ID }
                )
                return doc ? normalizeSettings(doc) : { ...DEFAULT_SETTINGS }
            })
        },

        async saveSettings(patch) {
            const client = requireWriteClient()
            const settings = normalizeSettings({ ...(await this.getSettings()), ...patch })

            await client.createOrReplace({
                _id: SETTINGS_DOC_ID,
                _type: "siteSettings",
                ...settings,
            })

            return settings
        },

        async listMedia() {
            return safeRead("listMedia", [], async () => {
                const assets = await readClient.fetch<
                    { _id: string; url: string; originalFilename?: string; _createdAt: string; size?: number }[]
                >(`*[_type == "sanity.imageAsset"] | order(_createdAt desc) {_id, url, originalFilename, _createdAt, size}`)

                return assets.map((asset) => ({
                    id: asset._id,
                    url: asset.url,
                    filename: asset.originalFilename || `${asset._id}.jpg`,
                    uploadedAt: asset._createdAt,
                    size: asset.size,
                }))
            })
        },

        async uploadMedia({ filename, contentType, data }: UploadInput): Promise<MediaItem> {
            const client = requireWriteClient()
            const asset = await client.assets.upload("image", data, {
                filename: filename || `${generateId()}.jpg`,
                contentType,
            })

            return {
                id: asset._id,
                url: asset.url,
                filename: asset.originalFilename || filename,
                uploadedAt: asset._createdAt,
                size: asset.size,
            }
        },

        async deleteMedia(id) {
            const client = requireWriteClient()

            try {
                await client.delete(id)
                return true
            } catch (error) {
                // Sanity refuses to delete an asset that a document still references.
                console.warn(`Failed to delete asset ${id}:`, error)
                return false
            }
        },
    }
}
