"use client"
import { newsLayout } from "@/lib/news-layout"
import { useState } from "react"
import Link from "next/link"
import { ArticleCard } from "@/components/article-card"
import { EditorialHero } from "@/components/editorial-hero"
import { HeadlineStrip, EditorialGrid } from "@/components/editorial-stories"
import { SectionHeading } from "@/components/section-heading"
import type { ArticleSection, ArticleSummary } from "@/lib/types"

export function SectionCollection({ articles, section }: { articles: ArticleSummary[]; section: ArticleSection }) {
    const [category, setCategory] = useState("all")
    const [limit, setLimit] = useState(12)
    const categories = [...new Set(articles.map(a => a.category))]
    const filtered = articles.filter(a => category === "all" || a.category === category)
    const news = section === "news"
    const educational = section === "how-stuff-works"
    const newsContent = newsLayout(articles, category)
    const hero = news ? newsContent.hero : section === "tech-kenya" && category === "all" ? articles[0] : undefined
    const headlines = news ? newsContent.headlines : []
    const remaining = filtered.filter(a => a.id !== hero?.id && !headlines.some(b => b.id === a.id))
    const feed = news ? newsContent.feed : remaining
    const visible = feed.slice(0, limit)
    return <>
        {hero && <div className="my-8"><EditorialHero article={hero} kenya={section === "tech-kenya"} /></div>}
        {headlines.length > 0 && <section className="my-8"><SectionHeading title="More headlines" /><HeadlineStrip articles={headlines} /></section>}
        {educational && <nav aria-label="Explore learning topics" className="my-8 flex flex-wrap gap-3">{categories.map(topic => <button key={topic} type="button" aria-pressed={category === topic} onClick={() => { setCategory(topic); setLimit(12) }} className="rounded-lg border px-5 py-3 text-sm hover:bg-muted aria-pressed:bg-muted">{topic}<span className="ml-3 text-muted-foreground">{articles.filter(a => a.category === topic).length}</span></button>)}</nav>}
        {section === "tech-kenya" && <div className="my-8 grid gap-6 rounded-xl border-l-4 border-brand-red bg-muted/40 p-6 sm:grid-cols-2"><div><p className="kicker text-brand-red">Kenya in focus</p><h2 className="mt-2 text-2xl font-bold">Ideas, infrastructure, impact.</h2><p className="mt-3 text-muted-foreground">Explore the people and developments shaping Kenya’s digital future.</p></div><nav aria-label="Kenyan technology coverage" className="flex flex-wrap content-center gap-2">{categories.map(topic => <button key={topic} type="button" aria-pressed={category === topic} onClick={() => { setCategory(topic); setLimit(12) }} className="rounded-full border bg-background px-4 py-2 text-sm aria-pressed:underline">{topic}</button>)}</nav></div>}
        <section className="py-8" aria-label="Browse articles">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4"><label className="text-sm">Category <select value={category} className="ml-2 max-w-full rounded border bg-background p-2" onChange={e => { setCategory(e.target.value); setLimit(12) }}><option value="all">All categories</option>{categories.map(c => <option key={c}>{c}</option>)}</select></label><p className="text-sm text-muted-foreground" role="status">{filtered.length} articles</p></div>
            {news ? <><SectionHeading title="Latest stories" />{visible.length ? <EditorialGrid articles={visible} /> : <p className="py-6 text-muted-foreground">No published stories in this category yet.</p>}</>
                : educational ? <div className="grid gap-8 md:grid-cols-2">{[...new Set(visible.map(a => a.category))].map(topic => <section key={topic} className="rounded-xl border p-6"><p className="kicker text-brand-red">Explore</p><h2 className="mt-2 border-b pb-4 text-2xl font-bold">{topic}</h2>{visible.filter(a => a.category === topic).map(a => <article key={a.id} className="border-b py-5 last:border-0"><Link href={a.href} className="group"><h3 className="text-xl font-bold"><span className="headline-link">{a.title}</span></h3><p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p><p className="mt-3 text-xs text-brand-red">{a.readTime} <span aria-hidden="true">↗</span></p></Link></article>)}</section>)}</div>
                : <div className={`grid gap-8 ${section === "reviews" ? "md:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>{visible.map(a => <ArticleCard key={a.id} article={a} variant={section === "reviews" ? "feature" : undefined} />)}</div>}
            {feed.length > visible.length && <button type="button" onClick={() => setLimit(n => n + 12)} className="mx-auto mt-8 block rounded-full border px-6 py-3 text-sm hover:bg-muted">Load more articles ({feed.length - visible.length} remaining)</button>}
        </section>
    </>
}
