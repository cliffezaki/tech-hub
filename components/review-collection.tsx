"use client"
import { useState, useRef } from "react"
import { ArticleCard } from "@/components/article-card"
import { ArticleRow } from "@/components/article-row"
import { SectionHeading } from "@/components/section-heading"
import type { ArticleSummary } from "@/lib/types"
export function ReviewCollection({ articles }: { articles: ArticleSummary[] }) {
    const [category, setCategory] = useState("all")
    const [count, setCount] = useState(4)
    const heading = useRef<HTMLDivElement>(null)
    const filtered = articles.filter(a => category === "all" || a.category === category)
    const cards = filtered.slice(0, count)
    const additional = filtered.slice(count)
    return <section className="py-8" aria-label="Review collection">
        <label className="mb-8 block text-sm">Category <select className="ml-3 max-w-full rounded border bg-background p-2" value={category} onChange={e => { setCategory(e.target.value); setCount(4) }}><option value="all">All categories</option>{[...new Set(articles.map(a => a.category))].map(c => <option key={c}>{c}</option>)}</select></label>
        <div ref={heading} tabIndex={-1} className="scroll-mt-24"><SectionHeading title="Latest Reviews" /></div>
        <div id="review-cards" className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-4">{cards.map(article => <ArticleCard key={article.id} article={article} />)}</div>
        <div className="mt-6 flex flex-wrap items-center gap-4">
            {additional.length > 0 && <button type="button" aria-controls="review-cards" onClick={() => setCount(n => n + 4)} className="rounded-full border px-5 py-2.5 text-sm hover:bg-muted">Show More</button>}
            {count > 4 && <button type="button" aria-controls="review-cards" onClick={() => { setCount(4); heading.current?.focus() }} className="rounded-full border px-5 py-2.5 text-sm hover:bg-muted">Show Less</button>}
            <p role="status" className="text-sm text-muted-foreground">Showing {cards.length} of {filtered.length} reviews as cards</p>
        </div>
        {additional.length > 0 && <section className="mt-12" aria-label="Additional reviews"><SectionHeading title="More Reviews" subtitle="Keep exploring our published reviews" /><div className="max-w-5xl">{additional.map(article => <ArticleRow key={article.id} article={article} />)}</div></section>}
    </section>
}
