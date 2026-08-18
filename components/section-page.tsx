import Link from "next/link"
import { FileText } from "lucide-react"

import { ArticleCard } from "@/components/article-card"
import { Button } from "@/components/ui/button"
import { getSectionArticles } from "@/lib/content"
import { SECTION_META } from "@/lib/types"
import type { ArticleSection } from "@/lib/types"

export async function SectionPage({ section }: { section: ArticleSection }) {
    const articles = await getSectionArticles(section)
    const meta = SECTION_META[section]

    const [lead, ...rest] = articles
    const secondary = rest.slice(0, 2)
    const grid = rest.slice(2)

    return (
        <div className="site-container py-10 md:py-14">
            <header className="border-b pb-8">
                <p className="kicker text-brand-red">{meta.label}</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{meta.title}</h1>
                <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{meta.subtitle}</p>
            </header>

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
                <>
                    <div className="grid gap-10 py-10 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            <ArticleCard article={lead} variant="feature" priority />
                        </div>

                        {secondary.length > 0 && (
                            <div className="flex flex-col gap-8 lg:col-span-4">
                                {secondary.map((article) => (
                                    <ArticleCard key={article.id} article={article} />
                                ))}
                            </div>
                        )}
                    </div>

                    {grid.length > 0 && (
                        <div className="grid gap-x-8 gap-y-10 border-t pt-10 sm:grid-cols-2 lg:grid-cols-3">
                            {grid.map((article) => (
                                <ArticleCard key={article.id} article={article} />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
