"use client"

import Link from "next/link"
import { useRef, useState } from "react"
import { ArticleCard } from "@/components/article-card"
import { SafeImage } from "@/components/safe-image"
import { SectionHeading } from "@/components/section-heading"
import { explainerLayout } from "@/lib/explainer-layout"
import type { ArticleSummary } from "@/lib/types"

function TextStory({ article }: { article: ArticleSummary }) {
    return <article className="min-w-0 py-5 first:pt-0 last:pb-0">
        <h3 className="text-xl font-bold leading-snug break-words"><Link className="hover:underline" href={article.href}>{article.title}</Link></h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <Link href={article.href} className="mt-3 inline-block text-sm text-brand-red">{article.readTime} <span aria-hidden="true">↗</span><span className="sr-only">: {article.title}</span></Link>
    </article>
}

export function ExplainerCollection({ articles, discovery = [] }: { articles: ArticleSummary[]; discovery?: ArticleSummary[] }) {
    const { hero, topics, explore, cards, collections } = explainerLayout(articles)
    const [count, setCount] = useState(4)
    const [announcement, setAnnouncement] = useState("")
    const grid = useRef<HTMLDivElement>(null)
    if (!hero) return <p className="py-8 text-muted-foreground">New explainers are on their way.</p>
    function showMore() {
        const next = Math.min(count + 4, cards.length)
        setCount(next)
        setAnnouncement(`Showing ${next} of ${cards.length} explainers.`)
        // Move focus into newly revealed content so removing the last button is safe.
        requestAnimationFrame(() => grid.current?.querySelectorAll<HTMLAnchorElement>(":scope > a")[count]?.focus())
    }
    return <div className="mt-8 space-y-10 md:space-y-12">
        <article className="overflow-hidden rounded-xl border bg-card text-card-foreground"><Link href={hero.href} className="block"><div className="relative aspect-[16/9] md:aspect-[21/9] bg-muted">{hero.imageUrl && <SafeImage src={hero.imageUrl} alt={hero.imageAlt || hero.title} fill priority sizes="100vw" className="object-cover" />}</div><div className="bg-[#252a30] text-white p-6 md:p-8"><p className="kicker text-brand-red">{hero.category}</p><h2 className="mt-3 text-3xl md:text-4xl font-bold">{hero.title}</h2><p className="mt-3 max-w-3xl text-white/80">{hero.excerpt}</p><span className="mt-4 inline-block text-sm font-semibold">Read More ↗</span></div></Link></article>
        <section aria-label="Explore topics">
            <SectionHeading title="Explore" />
            {!!discovery.length && <div className="mb-6 grid items-start gap-6 md:grid-cols-2"><Link href={discovery[0].href} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-[#252a30] text-white">{discovery[0].imageUrl && <SafeImage src={discovery[0].imageUrl} alt={discovery[0].imageAlt || ""} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" /><h2 className="absolute bottom-0 p-6 text-2xl font-bold leading-snug">{discovery[0].title}</h2></Link><div className="divide-y">{discovery.slice(1,5).map(article => <TextStory key={article.id} article={article} />)}</div></div>}

            <nav aria-label="Explainer topics" className="mb-6 flex flex-wrap gap-2">{topics.map(topic => <Link key={topic} href={`/search?category=${encodeURIComponent(topic)}&section=how-stuff-works`} className="rounded-full border px-4 py-2 text-sm hover:bg-muted">{topic}</Link>)}</nav>
            {!!explore.length && <div className="grid items-start gap-6 md:grid-cols-2">{explore.map(article => <div key={article.id} className="min-w-0 border-t pt-4"><h2 className="mb-4 text-2xl font-bold">{article.category}</h2><TextStory article={article} /></div>)}</div>}
        </section>
        {!!cards.length && <section aria-label="More Explainers">
            <SectionHeading title="More Explainers" />
            <div ref={grid} id="more-explainers" className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">{cards.slice(0, count).map(article => <ArticleCard key={article.id} article={article} />)}</div>
            <p className="sr-only" role="status">{announcement}</p>
            {count < cards.length && <div className="mt-6 text-center"><button type="button" aria-controls="more-explainers" className="rounded-full border px-6 py-3 text-sm font-semibold hover:bg-muted" onClick={showMore}>Show More</button></div>}
        </section>}
        {!!collections.length && <section aria-label="Topic Collections">
            <SectionHeading title="Topic Collections" />
            <div className={`grid items-start gap-6 ${collections.length > 1 ? "md:grid-cols-2" : ""}`}>{collections.map(group => <section key={group.topic} className="min-w-0 rounded-xl border p-6 md:p-8">
                <p className="kicker text-brand-red">Explore</p><h2 className="mt-3 border-b pb-5 text-3xl font-bold">{group.topic}</h2>
                <div className="mt-5 divide-y">{group.articles.map(article => <TextStory key={article.id} article={article} />)}</div>
            </section>)}</div>
        </section>}
    </div>
}
