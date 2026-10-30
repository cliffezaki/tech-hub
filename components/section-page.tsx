import Link from "next/link"
import { FileText } from "lucide-react"

import { ArticleCollection } from "@/components/article-collection"
import { Button } from "@/components/ui/button"
import { getSectionArticles, getPublishedPage } from "@/lib/content"
import { Markdown } from "@/components/markdown"
import { AdSlot } from "@/components/ad-slot"
import { notFound } from "next/navigation"
import { SECTION_META } from "@/lib/types"
import type { ArticleSection } from "@/lib/types"

export async function SectionPage({ section }: { section: ArticleSection }) {
    const articles = await getSectionArticles(section)
    const meta = SECTION_META[section]
    const page = await getPublishedPage(section)
    if (!page) notFound()

    return (
        <div className="site-container py-10 md:py-14">
            <header className="border-b pb-8">
                <p className="kicker text-brand-red">{meta.label}</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
                    {page.title}
                </h1>
                <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                    {page.excerpt}
                </p>
                {page.content && (
                    <div className="mt-6">
                        <Markdown content={page.content} />
                    </div>
                )}
            </header>

            <AdSlot slot={section} />
            {articles.length === 0 ? (
                <div className="py-20 text-center">
                    <FileText className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <h2 className="mt-4 text-xl font-bold">Nothing here yet</h2>
                    <p className="mt-2 text-muted-foreground">
                        No {meta.label} stories have been published so far.
                    </p>
                    <Link href="/" className="mt-6 inline-block">
                        <Button variant="outline">Back to the homepage</Button>
                    </Link>
                </div>
            ) : (
                <ArticleCollection articles={articles} leadLayout />
            )}
        </div>
    )
}
