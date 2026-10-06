import { createClient } from "next-sanity"
import type { SanityClient } from "next-sanity"
import { randomUUID } from "node:crypto"
import { unstable_rethrow } from "next/navigation"

import { apiVersion, dataset, projectId, writeToken } from "@/sanity/env"
import { urlForImage } from "@/sanity/lib/image"
import { DEFAULT_SETTINGS } from "@/lib/types"
import type { Article, MediaItem, PageContent, SiteSettings } from "@/lib/types"
import {
    generateId,
    normalizeArticle,
    normalizePage,
    normalizeSettings,
    slugify,
} from "./normalize"
import type { ContentStore, UploadInput } from "./types"

const SETTINGS_DOC_ID = "siteSettings"

const ARTICLE_PROJECTION = `{
    demo, demoBatch,
    ownerId, pinnedAreas, manualOrder, sponsorship,
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
    slug?: string | { current?: string }
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
    slug?: string | { current?: string }
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
            imageUrl = urlForImage(
                doc.mainImage as Parameters<typeof urlForImage>[0]
            ).url()
        } catch {
            imageUrl = undefined
        }
    }

    return normalizeArticle({
        ...doc,
        id: doc._id.replace(/^drafts\./, ""),
        status: doc._id.startsWith("drafts.") ? "draft" : doc.status,
        slug: typeof doc.slug === "object" ? doc.slug.current : doc.slug,
        imageUrl,
        updatedAt: doc._updatedAt,
    })
}

function toPage(doc: SanityPageDoc): PageContent {
    return normalizePage({
        ...doc,
        id: doc._id.replace(/^drafts\./, ""),
        slug: typeof doc.slug === "object" ? doc.slug.current : doc.slug,
        status: doc._id.startsWith("drafts.") ? "draft" : doc.status,
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
    // Sparse patches (feature/unpublish/order) must not erase existing image fields.
    if ("imageUrl" in input) assign("imageUrl", input.imageUrl ?? null)
    if ("imageAlt" in input) assign("imageAlt", input.imageAlt ?? null)
    if ("imageCredit" in input) assign("imageCredit", input.imageCredit ?? null)
    assign("status", input.status)
    assign("featured", input.featured)
    assign("ownerId", input.ownerId)
    assign("pinnedAreas", input.pinnedAreas)
    assign("manualOrder", input.manualOrder)
    assign("sponsorship", input.sponsorship)
    assign("demo", input.demo)
    assign("demoBatch", input.demoBatch)

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

    const writeClient = writeToken
        ? readClient.withConfig({ token: writeToken, perspective: "raw" })
        : null
    const privateRead = writeClient || readClient

    function logicalId(id: string) { return id.replace(/^drafts\./, "") }
    function storedId(id: string, status?: string) {
        return status === "draft" ? `drafts.${logicalId(id)}` : logicalId(id)
    }
    async function rawDocument(type: string, id: string) {
        return privateRead.fetch<Record<string, unknown> & { _id: string } | null>(
            `*[_type == $type && (_id == $id || _id == $draftId)] | order((_id == $draftId) desc) [0]`,
            { type, id: logicalId(id), draftId: `drafts.${logicalId(id)}` }
        )
    }
    async function patchDocument(type: string, id: string, patch: Record<string, unknown>, status?: string) {
        const client = requireWriteClient()
        const current = await rawDocument(type, id)
        if (!current) return false
        const nextStatus = status || (current._id.startsWith("drafts.") ? "draft" : String(current.status || "published"))
        const nextId = storedId(id, nextStatus)
        if (nextId === current._id) {
            await client.patch(current._id).set(patch).commit()
        } else {
            const fields: Record<string, unknown> & { _id: string; _type: string } = {
                ...current, ...patch, _id: nextId, _type: type, status: nextStatus,
            }
            delete fields._rev
            delete fields._createdAt
            delete fields._updatedAt
            // One atomic transaction transfers the content. No interval exposes a draft.
            await client.transaction().createOrReplace(fields).delete(current._id).commit()
        }
        return true
    }
    function deduplicate<T extends { _id: string }>(docs: T[]) {
        const byId = new Map<string, T>()
        for (const doc of docs) {
            const id = logicalId(doc._id)
            if (!byId.has(id) || doc._id.startsWith("drafts.")) byId.set(id, doc)
        }
        return [...byId.values()]
    }

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
    async function safeRead<T>(
        label: string,
        fallback: T,
        run: () => Promise<T>
    ): Promise<T> {
        try {
            return await run()
        } catch (error) {
            unstable_rethrow(error)
            console.error(`Sanity read failed (${label}):`, error)
            return fallback
        }
    }

    return {
        mode: "sanity",
        writable: Boolean(writeToken),

        async listArticles(includeDrafts = true) {
            return safeRead("listArticles", [], async () => {
                const docs = await (includeDrafts ? privateRead : readClient).fetch<SanityArticleDoc[]>(
                    `*[_type == "article" && !(_id in path("versions.**"))] | order(publishedAt desc) ${ARTICLE_PROJECTION}`
                )
                return deduplicate(docs).map(toArticle)
            })
        },

        async getArticle(id, includeDrafts = true) {
            return safeRead("getArticle", null, async () => {
                const doc = await (includeDrafts ? privateRead : readClient).fetch<SanityArticleDoc | null>(
                    `*[_type == "article" && (_id == $id || _id == $draftId)] | order((_id == $draftId) desc) [0] ${ARTICLE_PROJECTION}`,
                    { id: logicalId(id), draftId: `drafts.${logicalId(id)}` }
                )
                return doc ? toArticle(doc) : null
            })
        },

        async getArticleBySlug(slug, includeDrafts = true) {
            return safeRead("getArticleBySlug", null, async () => {
                const doc = await (includeDrafts ? privateRead : readClient).fetch<SanityArticleDoc | null>(
                    `*[_type == "article" && !(_id in path("versions.**")) && slug.current == $slug] | order((_id in path("drafts.**")) desc) [0] ${ARTICLE_PROJECTION}`,
                    { slug }
                )
                return doc ? toArticle(doc) : null
            })
        },

        async createArticle(input, createOnlyId) {
            const client = requireWriteClient()
            const document = {
                _id: storedId(createOnlyId || randomUUID(), input.status),
                _type: "article",
                ...toDocFields({ ...input, slug: input.slug || input.title }),
            }
            const created = createOnlyId
                ? await client.createIfNotExists(document)
                : await client.create(document)

            return toArticle(created as unknown as SanityArticleDoc)
        },

        async updateArticle(id, patch) {
            if (!(await patchDocument("article", id, toDocFields(patch), patch.status))) return null
            return this.getArticle(id)
        },

        async deleteArticle(id) {
            const client = requireWriteClient()
            const existing = await rawDocument("article", id)
            if (!existing) {
                return false
            }

            await client.transaction().delete(logicalId(id)).delete(`drafts.${logicalId(id)}`).commit()
            return true
        },

        async listPages(includeDrafts = true) {
            return safeRead("listPages", [], async () => {
                const docs = await (includeDrafts ? privateRead : readClient).fetch<SanityPageDoc[]>(
                    `*[_type == "page" && !(_id in path("versions.**"))] | order(_updatedAt desc) ${PAGE_PROJECTION}`
                )
                return deduplicate(docs).map(toPage)
            })
        },

        async getPage(id) {
            return safeRead("getPage", null, async () => {
                const doc = await privateRead.fetch<SanityPageDoc | null>(
                    `*[_type == "page" && (_id == $id || _id == $draftId)] | order((_id == $draftId) desc) [0] ${PAGE_PROJECTION}`,
                    { id: logicalId(id), draftId: `drafts.${logicalId(id)}` }
                )
                return doc ? toPage(doc) : null
            })
        },

        async getPageBySlug(slug, includeDrafts = true) {
            return safeRead("getPageBySlug", null, async () => {
                const doc = await (includeDrafts ? privateRead : readClient).fetch<SanityPageDoc | null>(
                    `*[_type == "page" && !(_id in path("versions.**")) && slug.current == $slug] | order((_id in path("drafts.**")) desc) [0] ${PAGE_PROJECTION}`,
                    { slug }
                )
                return doc ? toPage(doc) : null
            })
        },

        async createPage(input) {
            const client = requireWriteClient()
            const created = await client.create({
                _id: storedId(randomUUID(), input.status),
                _type: "page",
                title: input.title,
                slug: {
                    _type: "slug",
                    current: slugify(input.slug || input.title),
                },
                excerpt: input.excerpt,
                content: input.content,
                status: input.status,
            })

            return toPage(created as unknown as SanityPageDoc)
        },

        async updatePage(id, patch) {
            const fields: Record<string, unknown> = {}
            if (patch.title !== undefined) fields.title = patch.title
            if (patch.excerpt !== undefined) fields.excerpt = patch.excerpt
            if (patch.content !== undefined) fields.content = patch.content
            if (patch.status !== undefined) fields.status = patch.status
            if (patch.slug !== undefined)
                fields.slug = { _type: "slug", current: slugify(patch.slug) }

            if (!(await patchDocument("page", id, fields, patch.status))) return null
            return this.getPage(id)
        },

        async deletePage(id) {
            const client = requireWriteClient()
            const existing = await rawDocument("page", id)
            if (!existing) {
                return false
            }

            await client.transaction().delete(logicalId(id)).delete(`drafts.${logicalId(id)}`).commit()
            return true
        },

        async getSettings() {
            return safeRead(
                "getSettings",
                { ...DEFAULT_SETTINGS },
                async () => {
                    const doc =
                        await readClient.fetch<Partial<SiteSettings> | null>(
                            `*[_type == "siteSettings" && _id == $id][0]`,
                            { id: SETTINGS_DOC_ID }
                        )
                    return doc
                        ? normalizeSettings(doc)
                        : { ...DEFAULT_SETTINGS }
                }
            )
        },

        async saveSettings(patch) {
            const client = requireWriteClient()
            const settings = normalizeSettings({
                ...(await this.getSettings()),
                ...patch,
            })

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
                    {
                        _id: string
                        url: string
                        originalFilename?: string
                        _createdAt: string
                        size?: number
                    }[]
                >(
                    `*[_type in ["sanity.imageAsset", "sanity.fileAsset"]] | order(_createdAt desc) {_id, url, originalFilename, _createdAt, size}`
                )

                return assets.map((asset) => ({
                    id: asset._id,
                    url: asset.url,
                    filename: asset.originalFilename || `${asset._id}.jpg`,
                    uploadedAt: asset._createdAt,
                    size: asset.size,
                }))
            })
        },

        async uploadMedia({
            filename,
            contentType,
            data,
        }: UploadInput): Promise<MediaItem> {
            const client = requireWriteClient()
            const asset = await client.assets.upload(
                contentType === "application/pdf" ? "file" : "image",
                data,
                {
                    filename: filename || `${generateId()}.jpg`,
                    contentType,
                }
            )

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
