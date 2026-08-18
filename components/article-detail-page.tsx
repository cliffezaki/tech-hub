import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"

import { ArticleCard } from "@/components/article-card"
import { Markdown } from "@/components/markdown"
import { SafeImage } from "@/components/safe-image"
import { getArticleDetail, getRelatedArticles } from "@/lib/content"
import { formatDate } from "@/lib/format"
import { getSiteUrl } from "@/lib/site"
import { SECTION_META } from "@/lib/types"
import type { ArticleSection } from "@/lib/types"

interface ArticleDetailPageProps {
    section: ArticleSection
    slug: string
}

export async function ArticleDetailPage({ section, slug }: ArticleDetailPageProps) {
    const article = await getArticleDetail(section, slug)

    if (!article) {
        notFound()
    }

    const related = await getRelatedArticles(article)
    const meta = SECTION_META[section]

    // Helps Google show the headline, author, and image in search results.
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        description: article.excerpt,
        image: article.imageUrl ? [article.imageUrl] : undefined,
        datePublished: article.publishedAt,
        author: [{ "@type": "Person", name: article.author }],
        mainEntityOfPage: `${getSiteUrl()}${article.href}`,
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />

            <article className="site-container py-8 md:py-12">
                <Link
                    href={`/${section}`}
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to {meta.label}
                </Link>

                <header className="mx-auto mt-6 max-w-3xl">
                    <span className="kicker text-brand-red">{article.category}</span>

                    <h1 className="mt-3 text-3xl font-black leading-[1.12] text-balance md:text-5xl">{article.title}</h1>

                    {article.excerpt && (
                        <p className="mt-4 text-lg leading-relaxed text-muted-foreground md:text-xl">{article.excerpt}</p>
                    )}

                    <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 border-t pt-4 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{article.author}</span>
                        <span aria-hidden="true">·</span>
                        <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
                        <span aria-hidden="true">·</span>
                        <span>{article.readTime}</span>
                    </div>
                </header>

                {article.imageUrl && (
                    <figure className="mx-auto mt-8 max-w-4xl">
                        <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                            <SafeImage
                                src={article.imageUrl}
                                alt={article.imageAlt || article.title}
                                fill
                                priority
                                sizes="(max-width: 1024px) 100vw, 900px"
                                className="object-cover"
                            />
                        </div>
                        {article.imageCredit && (
                            <figcaption className="mt-2 text-xs text-muted-foreground">
                                Photograph: {article.imageCredit}
                            </figcaption>
                        )}
                    </figure>
                )}

                <div className="mx-auto mt-10 max-w-3xl">
                    <Markdown content={article.content} />
                </div>

                <div className="mx-auto mt-12 max-w-3xl border-t pt-6">
                    <Link
                        href={`/${section}`}
                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:text-brand-red"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        More {meta.label} stories
                    </Link>
                </div>
            </article>

            {related.length > 0 && (
                <aside className="border-t bg-muted/20">
                    <div className="site-container py-12">
                        <h2 className="mb-6 border-b pb-4 text-2xl font-bold">Related reading</h2>
                        <div className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
                            {related.map((item) => (
                                <ArticleCard key={item.id} article={item} />
                            ))}
                        </div>
                    </div>
                </aside>
            )}
        </>
    )
}
