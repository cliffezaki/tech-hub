"use client"

import { headlineVariables } from "@/lib/title-typography"
import { formatDate } from "@/lib/format"
import Link from "next/link"
import { useRef, useState } from "react"
import { ArticleCard } from "@/components/article-card"
import { SafeImage } from "@/components/safe-image"
import { SectionHeading } from "@/components/section-heading"
import { explainerLayout } from "@/lib/explainer-layout"
import type { ArticleSummary } from "@/lib/types"

function TextStory({ article }: { article: ArticleSummary }) {
    return <article className="min-w-0 py-5 first:pt-0 last:pb-0">
        <h3 data-article-title style={headlineVariables(article)} className="text-xl font-bold leading-snug break-words"><Link className="hover:underline" href={article.href}>{article.title}</Link></h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        <Link href={article.href} className="mt-3 inline-block text-sm text-brand-red">{article.readTime} <span aria-hidden="true">↗</span><span className="sr-only">: {article.title}</span></Link>
    </article>
}

export function ExplainerCollection({ articles, discovery = [], published = [] }: { articles: ArticleSummary[]; discovery?: ArticleSummary[]; published?: ArticleSummary[] }) {
    const { hero, topics, explore, cards: availableCards, collections } = explainerLayout(articles)
    const [count, setCount] = useState(4)
    const [announcement, setAnnouncement] = useState("")
    const grid = useRef<HTMLDivElement>(null)
    if (!hero) return <p className="py-8 text-muted-foreground">New explainers are on their way.</p>
    const occupied = new Set([hero, ...explore, ...collections.flatMap(group => group.articles), ...discovery].map(article => article.id))
    const terms = (article: ArticleSummary) => new Set(
        [article.category, ...(article.tags || []), article.title].join(" ").toLowerCase()
            .match(/\b[a-z]{4,}\b/g)?.filter(word => !["with", "that", "from", "what", "your", "does", "every", "news", "when", "they", "have", "this", "before"].includes(word))
    )
    const heroTerms = terms(hero)
    const related = published.filter(article => !occupied.has(article.id)).map(article => ({
        article, score: (article.section === "how-stuff-works" ? 2 : 0) + [...terms(article)].filter(word => heroTerms.has(word)).length
    })).filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, 4).map(item => item.article)
    const relatedIds = new Set(related.map(article => article.id))
    const cards = availableCards.filter(article => !relatedIds.has(article.id))
    const title = hero.title === "HTTPS protects the connection. It does not certify every claim on the page"
        ? "What HTTPS actually protects" : hero.mobileHeadline || hero.title
    function showMore() {
        const next = Math.min(count + 4, cards.length)
        setCount(next)
        setAnnouncement(`Showing ${next} of ${cards.length} explainers.`)
        // Move focus into newly revealed content so removing the last button is safe.
        requestAnimationFrame(() => grid.current?.querySelectorAll<HTMLAnchorElement>(":scope > a")[count]?.focus())
    }
    return <div className="mt-4 space-y-10 md:space-y-12">
        <article className="grid items-start gap-4 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
            <div className="min-w-0">
                <h2 data-article-title style={headlineVariables(hero)} className="font-serif text-3xl font-bold leading-tight"><Link href={hero.href}>{title}</Link></h2>
                <p className="kicker mt-3 text-brand-red">{hero.category}</p>
                <p className="mt-3 leading-relaxed">{hero.excerpt}</p>
                <p className="mt-3 text-xs text-muted-foreground">{hero.author} · {formatDate(hero.publishedAt)} · {hero.readTime}</p>
                <Link className="mt-4 inline-block border-b text-sm font-semibold" href={hero.href}>Read More ↗</Link>
                {!!related.length && <section className="mt-5 border-t pt-3">
                    <h3 className="kicker">More explainers</h3>
                    <div className="explainer-links">{related.map(article => <Link key={article.id} href={article.href} className="font-serif hover:underline">{article.mobileHeadline || article.title} <span aria-hidden="true">↗</span></Link>)}</div>
                </section>}
            </div>
            <Link href={hero.href} aria-label={hero.title} className="relative order-first block aspect-[4/3] overflow-hidden rounded-xl bg-muted md:order-last md:aspect-[16/10]">
                {hero.imageUrl && <SafeImage src={hero.imageUrl} alt={hero.imageAlt || ""} fill priority sizes="(max-width:767px) 100vw,50vw" className="object-cover" />}
                {(hero.quickFacts?.[0] || title === "What HTTPS actually protects") && <span className="absolute inset-x-0 bottom-0 flex min-h-[22%] items-center bg-gradient-to-b from-black/60 to-black/85 px-[4%] py-3 font-serif text-base leading-snug text-white backdrop-blur-sm md:text-lg">{hero.quickFacts?.[0] || "Encryption protects information travelling between your browser and the website."}</span>}
            </Link>
        </article>
        <section aria-label="Explore topics">
            <SectionHeading title="Explore" />
            {!!discovery.length && <div className="mb-6 grid items-start gap-6 md:grid-cols-2"><figure><Link href={discovery[0].href} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-[#252a30] text-white">{discovery[0].imageUrl && <SafeImage src={discovery[0].imageUrl} alt={discovery[0].imageAlt || ""} fill sizes="(max-width: 767px) 100vw, 50vw" className="object-cover" />}<div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" /><h2 data-article-title style={headlineVariables(discovery[0])} className="absolute bottom-0 p-6 text-2xl font-bold leading-snug">{discovery[0].title}</h2></Link><figcaption className="mt-3 text-sm leading-relaxed text-muted-foreground">{discovery[0].quickFacts?.[0] || discovery[0].excerpt}</figcaption></figure><div className="divide-y">{discovery.slice(1,7).map(article => <article key={article.id} className="py-3 first:pt-0"><h3 className="font-sans text-base font-semibold leading-snug"><Link href={article.href} className="hover:underline">{article.title}</Link></h3><p className="mt-1 text-sm leading-snug text-muted-foreground">{article.quickFacts?.[0] || article.excerpt}</p></article>)}</div></div>}

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
