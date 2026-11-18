"use client"
import { useState, useRef } from "react"
import { ReviewSpotlight } from "@/components/review-spotlight"
import { ArticleCard } from "@/components/article-card"
import { ArticleRow } from "@/components/article-row"
import { SectionHeading } from "@/components/section-heading"
import type { ArticleSummary } from "@/lib/types"
export function ReviewCollection({ articles }: { articles: ArticleSummary[] }) {
    const [count, setCount] = useState(4)
    const heading = useRef<HTMLDivElement>(null)
    const filtered = articles
    const spotlight = filtered.find(a => a.pinnedAreas?.includes("reviews:featured")) || filtered.find(a => !a.pinnedAreas?.includes("reviews:latest") && a.featured && a.imageUrl) || filtered.find(a => !a.pinnedAreas?.includes("reviews:latest") && a.imageUrl)
    const feed = filtered.filter(a=>a.id!==spotlight?.id)
    const cards = feed.slice(0, count)
    const additional = feed.slice(count)
    return <section className="pb-8" aria-label="Review collection">
        {spotlight && <ReviewSpotlight article={spotlight} />}
        <div ref={heading} tabIndex={-1} className="scroll-mt-24"><SectionHeading title="Latest Reviews" /></div>
        <div id="review-cards" className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4">{cards.map(article => <ArticleCard key={article.id} article={article} />)}</div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
            {additional.length > 0 && <button type="button" aria-controls="review-cards" onClick={() => setCount(n => n + 4)} className="rounded-full border px-5 py-2.5 text-sm hover:bg-muted">Show More</button>}
            {count > 4 && <button type="button" aria-controls="review-cards" onClick={() => { setCount(4); heading.current?.focus() }} className="rounded-full border px-5 py-2.5 text-sm hover:bg-muted">Show Less</button>}
            <p role="status" className="text-sm text-muted-foreground">Showing {cards.length} of {feed.length} reviews as cards</p>
        </div>
        {additional.length > 0 && <section className="mt-12" aria-label="Additional reviews"><SectionHeading title="More Reviews" subtitle="Keep exploring our published reviews" /><div className="max-w-5xl">{additional.map(article => <ArticleRow key={article.id} article={article} />)}</div></section>}
    </section>
}
