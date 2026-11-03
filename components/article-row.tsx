import Link from "next/link"
import { SafeImage } from "@/components/safe-image"
import { formatDate } from "@/lib/format"
import type { ArticleSummary } from "@/lib/types"

export function ArticleRow({ article, compact = false }: { article: ArticleSummary; compact?: boolean }) {
    return <article className="border-b py-6 last:border-b-0">
        <Link href={article.href} className={`group grid items-start gap-4 ${compact ? "grid-cols-[5rem_minmax(0,1fr)]" : "grid-cols-[5.5rem_minmax(0,1fr)] sm:grid-cols-[12rem_minmax(0,1fr)] md:gap-7"}`}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">{article.imageUrl && <SafeImage src={article.imageUrl} alt={article.imageAlt || ""} fill sizes={compact ? "80px" : "(max-width: 640px) 88px, 192px"} className="object-cover" />}</div>
            <div className="min-w-0"><p className="kicker text-brand-red">{article.category}</p><h3 className={`mt-2 font-bold leading-snug ${compact ? "text-lg" : "text-lg sm:text-2xl"}`}><span className="headline-link">{article.title}</span></h3>
                {!compact && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{article.excerpt}</p>}
                <p className="mt-3 text-xs text-muted-foreground"><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time><span aria-hidden="true"> · </span>{article.readTime}</p>
            </div>
        </Link>
    </article>
}
