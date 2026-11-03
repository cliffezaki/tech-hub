import Link from "next/link"
import { SafeImage } from "@/components/safe-image"
import { formatDate } from "@/lib/format"
import type { ArticleSummary } from "@/lib/types"

export function ReviewSpotlight({ article }: { article: ArticleSummary }) {
    return <article aria-label="Review spotlight" className="mb-10 border-t pt-5">
        <p className="kicker mb-5 text-brand-red">Review spotlight · {article.category}</p>
        <div className="grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
            <div className="min-w-0">
                <h2 className="text-3xl font-black leading-tight md:text-4xl"><Link className="hover:underline" href={article.href}>{article.title}</Link></h2>
                <p className="mt-4 text-base leading-relaxed text-muted-foreground">{article.excerpt}</p>
                <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{article.author} · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time> · {article.readTime}</p>
                <Link href={article.href} className="mt-5 inline-block border-b pb-1 text-sm font-semibold">Read the review <span aria-hidden="true">↗</span><span className="sr-only">: {article.title}</span></Link>
            </div>
            <Link href={article.href} aria-label={`Read ${article.title}`} className="relative block aspect-[3/2] overflow-hidden rounded-lg bg-muted lg:col-span-2">
                <SafeImage src={article.imageUrl!} alt={article.imageAlt || article.title} fill priority sizes="(max-width: 1023px) 100vw, 66vw" className="object-cover" />
            </Link>
        </div>
    </article>
}
