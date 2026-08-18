import fs from "fs"
import path from "path"

import { DEFAULT_SETTINGS } from "@/lib/types"
import type { Article, MediaItem, PageContent, SiteSettings } from "@/lib/types"
import {
    generateId,
    normalizeArticle,
    normalizePage,
    normalizeSettings,
    slugify,
    sortByPublishedAt,
} from "./normalize"
import type { ContentStore, UploadInput } from "./types"

const CONTENT_DIR = path.join(process.cwd(), "content")
const ARTICLES_DIR = path.join(CONTENT_DIR, "articles")
const PAGES_DIR = path.join(CONTENT_DIR, "pages")
const SETTINGS_FILE = path.join(CONTENT_DIR, "settings.json")
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads")

/**
 * Serverless hosts ship a read-only bundle, so writing JSON to disk silently loses
 * content. The store reports itself as read-only there and the API layer turns that
 * into an explanatory error instead of a filesystem crash.
 */
const IS_SERVERLESS = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME)

function ensureDir(dir: string) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }
}

function readJsonDir<T>(dir: string, normalize: (raw: Record<string, unknown>) => T): T[] {
    if (!fs.existsSync(dir)) {
        return []
    }

    return fs
        .readdirSync(dir)
        .filter((fileName) => fileName.endsWith(".json"))
        .flatMap((fileName) => {
            try {
                const raw = JSON.parse(fs.readFileSync(path.join(dir, fileName), "utf8"))
                return [normalize(raw)]
            } catch {
                // A hand-edited file with a syntax error should not take down the whole site.
                console.warn(`Skipping unreadable content file: ${fileName}`)
                return []
            }
        })
}

function writeJson(filePath: string, value: unknown) {
    ensureDir(path.dirname(filePath))
    fs.writeFileSync(filePath, JSON.stringify(value, null, 2))
}

function uniqueSlug(slug: string, existing: Article[] | PageContent[], selfId?: string) {
    const base = slug || generateId()
    let candidate = base
    let suffix = 2

    while (existing.some((item) => item.slug === candidate && item.id !== selfId)) {
        candidate = `${base}-${suffix}`
        suffix += 1
    }

    return candidate
}

export function createFileStore(): ContentStore {
    return {
        mode: "file",
        writable: !IS_SERVERLESS,

        async listArticles() {
            return sortByPublishedAt(readJsonDir(ARTICLES_DIR, normalizeArticle))
        },

        async getArticle(id) {
            const filePath = path.join(ARTICLES_DIR, `${id}.json`)
            if (!fs.existsSync(filePath)) {
                return null
            }

            return normalizeArticle(JSON.parse(fs.readFileSync(filePath, "utf8")))
        },

        async getArticleBySlug(slug) {
            const articles = await this.listArticles()
            return articles.find((article) => article.slug === slug) || null
        },

        async createArticle(input) {
            const articles = await this.listArticles()
            const id = generateId()
            const article = normalizeArticle({
                ...input,
                id,
                slug: uniqueSlug(slugify(input.slug || input.title), articles),
                updatedAt: new Date().toISOString(),
            })

            writeJson(path.join(ARTICLES_DIR, `${id}.json`), article)
            return article
        },

        async updateArticle(id, patch) {
            const current = await this.getArticle(id)
            if (!current) {
                return null
            }

            const articles = await this.listArticles()
            const article = normalizeArticle({
                ...current,
                ...patch,
                id,
                slug: uniqueSlug(slugify(patch.slug || current.slug || current.title), articles, id),
                updatedAt: new Date().toISOString(),
            })

            writeJson(path.join(ARTICLES_DIR, `${id}.json`), article)
            return article
        },

        async deleteArticle(id) {
            const filePath = path.join(ARTICLES_DIR, `${id}.json`)
            if (!fs.existsSync(filePath)) {
                return false
            }

            fs.unlinkSync(filePath)
            return true
        },

        async listPages() {
            return readJsonDir(PAGES_DIR, normalizePage).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        },

        async getPage(id) {
            const filePath = path.join(PAGES_DIR, `${id}.json`)
            if (!fs.existsSync(filePath)) {
                return null
            }

            return normalizePage(JSON.parse(fs.readFileSync(filePath, "utf8")))
        },

        async getPageBySlug(slug) {
            const pages = await this.listPages()
            return pages.find((page) => page.slug === slug) || null
        },

        async createPage(input) {
            const pages = await this.listPages()
            const id = generateId()
            const page = normalizePage({
                ...input,
                id,
                slug: uniqueSlug(slugify(input.slug || input.title), pages),
                updatedAt: new Date().toISOString(),
            })

            writeJson(path.join(PAGES_DIR, `${id}.json`), page)
            return page
        },

        async updatePage(id, patch) {
            const current = await this.getPage(id)
            if (!current) {
                return null
            }

            const pages = await this.listPages()
            const page = normalizePage({
                ...current,
                ...patch,
                id,
                slug: uniqueSlug(slugify(patch.slug || current.slug || current.title), pages, id),
                updatedAt: new Date().toISOString(),
            })

            writeJson(path.join(PAGES_DIR, `${id}.json`), page)
            return page
        },

        async deletePage(id) {
            const filePath = path.join(PAGES_DIR, `${id}.json`)
            if (!fs.existsSync(filePath)) {
                return false
            }

            fs.unlinkSync(filePath)
            return true
        },

        async getSettings() {
            if (!fs.existsSync(SETTINGS_FILE)) {
                return { ...DEFAULT_SETTINGS }
            }

            try {
                return normalizeSettings(JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8")) as SiteSettings)
            } catch {
                return { ...DEFAULT_SETTINGS }
            }
        },

        async saveSettings(patch) {
            const settings = normalizeSettings({ ...(await this.getSettings()), ...patch })
            writeJson(SETTINGS_FILE, settings)
            return settings
        },

        async listMedia() {
            if (!fs.existsSync(UPLOADS_DIR)) {
                return []
            }

            return fs
                .readdirSync(UPLOADS_DIR)
                .filter((fileName) => !fileName.startsWith("."))
                .map((fileName) => {
                    const stats = fs.statSync(path.join(UPLOADS_DIR, fileName))
                    return {
                        id: fileName,
                        url: `/uploads/${fileName}`,
                        filename: fileName,
                        uploadedAt: stats.mtime.toISOString(),
                        size: stats.size,
                    }
                })
                .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
        },

        async uploadMedia({ filename, data }: UploadInput): Promise<MediaItem> {
            ensureDir(UPLOADS_DIR)

            const extension = path.extname(filename).toLowerCase() || ".jpg"
            const base = slugify(path.basename(filename, path.extname(filename))) || "image"
            const storedName = `${base}-${generateId()}${extension}`

            fs.writeFileSync(path.join(UPLOADS_DIR, storedName), data)

            return {
                id: storedName,
                url: `/uploads/${storedName}`,
                filename: storedName,
                uploadedAt: new Date().toISOString(),
                size: data.length,
            }
        },

        async deleteMedia(id) {
            // Guard against `..` segments arriving from the client.
            const filePath = path.join(UPLOADS_DIR, path.basename(id))
            if (!fs.existsSync(filePath)) {
                return false
            }

            fs.unlinkSync(filePath)
            return true
        },
    }
}
