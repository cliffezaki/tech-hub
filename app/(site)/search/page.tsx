import type { Metadata } from "next"

import { SearchClient } from "@/components/search-client"
import { getAllArticleSummaries } from "@/lib/content"

export const metadata: Metadata = {
    title: "Search",
    description: "Search every article published on Tech Hub.",
}

export default async function SearchPage() {
    const articles = await getAllArticleSummaries()

    return (
        <div className="site-container py-12 md:py-16">
            <header className="mx-auto max-w-3xl text-center">
                <p className="kicker text-brand-red">Search</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Find a story</h1>
                <p className="mt-3 text-muted-foreground">
                    Searching {articles.length} published article{articles.length === 1 ? "" : "s"}.
                </p>
            </header>

            <SearchClient articles={articles} />
        </div>
    )
}
