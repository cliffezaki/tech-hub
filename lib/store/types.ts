import type { Article, MediaItem, PageContent, SiteSettings } from "@/lib/types"

export type StoreMode = "sanity" | "file"

export interface UploadInput {
    filename: string
    contentType: string
    data: Buffer
}

/**
 * One content API with two interchangeable drivers.
 *
 * - `sanity` is used whenever Sanity credentials are present. It is the driver that
 *   works on serverless hosts such as Vercel, where the filesystem is read-only.
 * - `file` keeps the original JSON-on-disk behaviour so the project still runs
 *   locally with zero configuration.
 */
export interface ContentStore {
    readonly mode: StoreMode
    /** True when the driver can persist changes in the current environment. */
    readonly writable: boolean

    listArticles(): Promise<Article[]>
    getArticle(id: string): Promise<Article | null>
    getArticleBySlug(slug: string): Promise<Article | null>
    createArticle(input: Omit<Article, "id">): Promise<Article>
    updateArticle(id: string, patch: Partial<Article>): Promise<Article | null>
    deleteArticle(id: string): Promise<boolean>

    listPages(): Promise<PageContent[]>
    getPage(id: string): Promise<PageContent | null>
    getPageBySlug(slug: string): Promise<PageContent | null>
    createPage(input: Omit<PageContent, "id" | "updatedAt">): Promise<PageContent>
    updatePage(id: string, patch: Partial<PageContent>): Promise<PageContent | null>
    deletePage(id: string): Promise<boolean>

    getSettings(): Promise<SiteSettings>
    saveSettings(patch: Partial<SiteSettings>): Promise<SiteSettings>

    listMedia(): Promise<MediaItem[]>
    uploadMedia(input: UploadInput): Promise<MediaItem>
    deleteMedia(id: string): Promise<boolean>
}
