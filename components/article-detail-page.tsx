import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, Star } from "lucide-react"
import { PortableText } from "next-sanity"
import type { TypedObject } from "sanity"

import { getArticleDetail } from "@/lib/content"
import type { ArticleSection } from "@/lib/types"

interface ArticleDetailPageProps {
    section: ArticleSection
    slug: string
    backHref: string
    backLabel: string
    moreLabel: string
    showRating?: boolean
}

function TextContent({ content }: { content: string }) {
    const blocks = content
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)

    return (
        <>
            {blocks.map((block, index) => {
                if (block.startsWith("### ")) {
                    return <h3 key={index}>{block.replace(/^### /, "")}</h3>
                }

                if (block.startsWith("## ")) {
                    return <h2 key={index}>{block.replace(/^## /, "")}</h2>
                }

                if (block.startsWith("# ")) {
                    return <h2 key={index}>{block.replace(/^# /, "")}</h2>
                }

                const listItems = block
                    .split("\n")
                    .map((line) => line.trim())
                    .filter((line) => line.startsWith("- "))

                if (listItems.length > 0) {
                    return (
                        <ul key={index}>
                            {listItems.map((line) => (
                                <li key={line}>{line.replace(/^- /, "")}</li>
                            ))}
                        </ul>
                    )
                }

                return <p key={index}>{block}</p>
            })}
        </>
    )
}

export async function ArticleDetailPage({
    section,
    slug,
    backHref,
    backLabel,
    moreLabel,
    showRating = false,
}: ArticleDetailPageProps) {
    const article = await getArticleDetail(section, slug)

    if (!article) {
        return notFound()
    }

    return (
        <div className="container mx-auto max-w-4xl px-4 py-12">
            <Link
                href={backHref}
                className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
                <ArrowLeft className="h-4 w-4" />
                {backLabel}
            </Link>

            <article className="space-y-8">
                <header className="space-y-4 border-b pb-8">
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest">
                        <span className="text-brand-red">{article.category}</span>
                        <span className="text-gray-400">/</span>
                        <span className="text-gray-500">{article.readTime}</span>
                    </div>

                    <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-black leading-tight md:text-5xl">
                        {article.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>By {article.author}</span>
                        <span>/</span>
                        <time>{new Date(article.publishedAt).toLocaleDateString()}</time>
                    </div>

                    {showRating && (
                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {[1, 2, 3, 4].map((star) => (
                                    <Star key={star} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                ))}
                                <Star className="h-5 w-5 text-gray-300" />
                            </div>
                            <span className="text-sm font-semibold">4.0 / 5.0</span>
                        </div>
                    )}
                </header>

                {article.imageUrl && (
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                        <Image
                            src={article.imageUrl}
                            alt={article.title}
                            fill
                            unoptimized
                            className="object-cover"
                        />
                    </div>
                )}

                <div className="prose prose-lg max-w-none dark:prose-invert [&>p]:font-[family-name:var(--font-inter)]">
                    {article.body ? (
                        <PortableText value={article.body as TypedObject[]} />
                    ) : article.content ? (
                        <TextContent content={article.content} />
                    ) : (
                        <p className="italic text-muted-foreground">No content available.</p>
                    )}
                </div>

                <footer className="border-t pt-8">
                    <Link
                        href={backHref}
                        className="inline-flex items-center gap-2 text-sm font-medium hover:text-brand-red"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {moreLabel}
                    </Link>
                </footer>
            </article>
        </div>
    )
}
