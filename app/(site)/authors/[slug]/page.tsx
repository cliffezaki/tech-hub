import { notFound } from "next/navigation"
import { getAllArticleSummaries } from "@/lib/content"
import { authorSlug } from "@/lib/authors"
import { ArticleCollection } from "@/components/article-collection"

export default async function AuthorPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const articles = (await getAllArticleSummaries()).filter(a => authorSlug(a.author) === slug)
    if (!articles.length) notFound()
    const names = [...new Set(articles.map(a => a.author))]
    return (
        <div className="site-container py-10 md:py-14">
            <header className="border-b pb-8">
                <p className="kicker text-brand-red">Byline archive</p>
                <h1 className="mt-3 text-4xl font-black md:text-5xl">{names.join(" / ")}</h1>
                <p className="mt-4 max-w-2xl text-muted-foreground">
                    {articles.every(a => a.demo)
                        ? "A collection of researched editorial samples. This demo desk is not a fictitious human journalist; reviews are based on documentation, not hands-on tests."
                        : "Published articles under this byline. This archive does not expose private account details."}
                </p>
            </header>
            <ArticleCollection articles={articles} />
        </div>
    )
}
