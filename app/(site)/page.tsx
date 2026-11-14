import Link from "next/link"
import { TrendingNews } from "@/components/trending-news"
import { EditorialGrid, ReviewStrip } from "@/components/editorial-stories"
import { ArticleRow } from "@/components/article-row"
import { NewsTicker } from "@/components/news-ticker"
import { ArrowRight, PenLine } from "lucide-react"

import { ArticleCard } from "@/components/article-card"
import { NewsletterBox } from "@/components/newsletter-box"
import { SafeImage } from "@/components/safe-image"
import { SectionHeading } from "@/components/section-heading"
import { Button } from "@/components/ui/button"
import { getHomepageContent } from "@/lib/content"
import { formatDate } from "@/lib/format"
import { AdSlot } from "@/components/ad-slot"

export default async function Home() {
    const {
        settings,
        lead,
        secondary,
        featured,
        latestNews,
        sections,
        newsCount,
        ticker,
        reviews,
    } = await getHomepageContent()

    if (!lead) {
        return (
            <div className="site-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
                <PenLine className="h-12 w-12 text-muted-foreground/40" />
                <h1 className="mt-6 text-3xl font-bold">
                    Nothing published yet
                </h1>
                <p className="mt-3 max-w-md text-muted-foreground">
                    {settings.siteName} is ready to go. Write your first story
                    in the dashboard and it will appear here straight away.
                </p>
                <Link href="/admin" className="mt-6">
                    <Button>
                        Open the dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </Link>
            </div>
        )
    }

    const heroTitle = settings.heroTitle || lead.title
    const heroSubtitle = settings.heroSubtitle || lead.excerpt

    return (
        <div>
            <div className="site-container"><NewsTicker articles={ticker} /></div>
            <AdSlot slot="homepage-top" />
            {/* Lead story with two supporting highlights */}
            <section className="border-b bg-muted/20">
                <div className="site-container py-10 md:py-14">
                    <div className="grid items-start gap-10 lg:grid-cols-12">
                        <div className="lg:col-span-8">
                            <Link href={lead.href} className="group block">
                                <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-muted">
                                    {lead.imageUrl && (
                                        <SafeImage
                                            src={lead.imageUrl}
                                            alt={lead.imageAlt || lead.title}
                                            fill
                                            priority
                                            sizes="(max-width: 1024px) 100vw, 66vw"
                                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                                        />
                                    )}
                                </div>

                                <div className="mt-6">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className="kicker rounded-full bg-brand-solid px-2.5 py-1 text-brand-on-solid">
                                            {settings.heroEyebrow}
                                        </span>
                                        <span className="kicker text-muted-foreground">
                                            {lead.category}
                                        </span>
                                    </div>

                                    <h1 className="mt-4 text-3xl font-black leading-[1.08] text-balance md:text-5xl lg:text-6xl">
                                        <span className="headline-link">
                                            {heroTitle}
                                        </span>
                                    </h1>

                                    <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
                                        {heroSubtitle}
                                    </p>

                                    <div className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                                        <span className="font-medium text-foreground/80">
                                            {lead.author}
                                        </span>
                                        <span aria-hidden="true">·</span>
                                        <time dateTime={lead.publishedAt}>
                                            {formatDate(lead.publishedAt)}
                                        </time>
                                        <span aria-hidden="true">·</span>
                                        <span>{lead.readTime}</span>
                                    </div>
                                </div>
                            </Link>
                            {!!lead.quickFacts?.length && <section aria-labelledby="lead-quick-facts" className="mt-8 border-t pt-5"><h2 id="lead-quick-facts" className="kicker text-brand-red">At a Glance</h2><ul className="mt-3 grid gap-x-6 sm:grid-cols-2">{lead.quickFacts.slice(0, 6).map((fact, i) => <li key={i} className="border-b py-1.5 text-[0.8125rem] leading-5 break-words list-disc ml-4">{fact}</li>)}</ul></section>}
                        </div>

                        {(
                            <div className="lg:col-span-4">
                                <TrendingNews />
                                <h2 className="kicker mt-8 border-b pb-3 text-muted-foreground">
                                    Also worth reading
                                </h2>
                                <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-1">
                                    {secondary.slice(1).map((article) => (
                                        <ArticleCard key={article.id} article={article} className="[&_h3]:line-clamp-3 [&_h3]:min-h-[3.75em]" />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Editor-selected highlights */}
            {featured.length > 0 && (
                <section className="site-container py-12 md:py-16">
                    <SectionHeading
                        title="Featured"
                        subtitle="Worth your time, from across Tech Hub"
                    />
                    <EditorialGrid articles={featured} />
                </section>
            )}

            {reviews.length > 0 && <section className="site-container pb-12 md:pb-16" aria-label="Reviews"><SectionHeading title="Reviews" href="/reviews" linkLabel="View All Reviews" /><ReviewStrip articles={reviews} /></section>}

            {/* The main news feed */}
            {latestNews.length > 0 && (
                <section
                    className={
                        featured.length > 0
                            ? "border-t bg-muted/20"
                            : "bg-muted/20"
                    }
                >
                    <div className="site-container py-12 md:py-16">
                        <SectionHeading
                            title="Latest news"
                            subtitle={`${newsCount} article${newsCount === 1 ? "" : "s"} published`}
                            href="/news"
                            linkLabel="All news"
                        />
                        <div className="max-w-5xl sm:[&_h3]:text-[1.375rem]">
                            {latestNews.map(article => <ArticleRow key={article.id} article={article} extended />)}
                        </div>
                    </div>
                </section>
            )}

            {/* Sections are linked, not unpacked — each has its own page */}
            <AdSlot slot="homepage-middle" />
            <section className="site-container py-12 md:py-16">
                <SectionHeading title="More from Tech Hub" subtitle="Browse the rest of the site by section" />
                <div className="grid items-start gap-6 lg:grid-cols-12">
                    <div className="min-w-0 lg:col-span-8">

                        <div className="grid gap-4 sm:grid-cols-2">
                            {sections.map((item) => (
                                <Link
                                    key={item.section}
                                    href={item.href}
                                    className="group rounded-xl border bg-card p-5 transition-colors hover:border-foreground/30 hover:bg-accent"
                                >
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-lg font-bold">
                                            {item.label}
                                        </h3>
                                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                                        {item.subtitle}
                                    </p>
                                    <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">
                                        {item.count} article
                                        {item.count === 1 ? "" : "s"}
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="lg:col-span-4">
                        <NewsletterBox
                            title={settings.newsletterTitle}
                            text={settings.newsletterText}
                            contactEmail={settings.contactEmail}
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}
