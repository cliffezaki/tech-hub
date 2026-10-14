import type { Article } from "@/lib/types"
// Scheduled stories remain private Sanity drafts. Only this server-side gate
// admits them to public reads once their scheduled instant has arrived.
export function articleVisible(article: Pick<Article, "status" | "scheduledAt">, now = Date.now()) {
    return article.status === "published" || (article.status === "draft" && !!article.scheduledAt && Number.isFinite(Date.parse(article.scheduledAt)) && Date.parse(article.scheduledAt) <= now)
}
