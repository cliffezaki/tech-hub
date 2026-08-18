import Link from "next/link"

import { SafeImage } from "@/components/safe-image"
import { formatDate } from "@/lib/format"
import type { ArticleSummary } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ArticleCardProps {
    article: ArticleSummary
    /** `feature` is the large lead treatment, `compact` drops the image for list rails. */
    variant?: "default" | "feature" | "compact"
    priority?: boolean
    className?: string
}

function Placeholder({ className }: { className?: string }) {
    return (
        <div className={cn("flex h-full w-full items-center justify-center bg-muted", className)}>
            <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-muted-foreground/30">TH</span>
        </div>
    )
}

export function ArticleCard({ article, variant = "default", priority = false, className }: ArticleCardProps) {
    const meta = (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/80">{article.author}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{article.readTime}</span>
        </div>
    )

    if (variant === "compact") {
        return (
            <Link href={article.href} className={cn("group block", className)}>
                <span className="kicker text-brand-red">{article.category}</span>
                <h3 className="mt-1.5 text-base font-bold leading-snug">
                    <span className="headline-link">{article.title}</span>
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
                <div className="mt-2">{meta}</div>
            </Link>
        )
    }

    const isFeature = variant === "feature"

    return (
        <Link href={article.href} className={cn("group flex h-full flex-col", className)}>
            <div
                className={cn(
                    "relative overflow-hidden rounded-lg bg-muted",
                    isFeature ? "aspect-[16/9]" : "aspect-[3/2]"
                )}
            >
                {article.imageUrl ? (
                    <SafeImage
                        src={article.imageUrl}
                        alt={article.imageAlt || article.title}
                        fill
                        priority={priority}
                        sizes={isFeature ? "(max-width: 1024px) 100vw, 66vw" : "(max-width: 768px) 100vw, 33vw"}
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                ) : (
                    <Placeholder />
                )}
            </div>

            <div className={cn("flex flex-1 flex-col", isFeature ? "mt-5" : "mt-4")}>
                <span className="kicker text-brand-red">{article.category}</span>

                <h3
                    className={cn(
                        "mt-2 font-bold leading-tight text-balance",
                        isFeature ? "text-2xl md:text-4xl" : "text-lg md:text-xl"
                    )}
                >
                    <span className="headline-link">{article.title}</span>
                </h3>

                <p
                    className={cn(
                        "mt-2.5 leading-relaxed text-muted-foreground",
                        isFeature ? "line-clamp-3 text-base md:text-lg" : "line-clamp-2 text-sm"
                    )}
                >
                    {article.excerpt}
                </p>

                <div className="mt-auto pt-3">{meta}</div>
            </div>
        </Link>
    )
}
