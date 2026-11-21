import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { getAllArticleSummaries } from "@/lib/content"
import { ArticleCollection } from "@/components/article-collection"
import { topicSlug } from "@/lib/topics"
async function lookup(topic: string) {
    const articles = await getAllArticleSummaries()
    const name = articles.flatMap(a => a.tags || []).find(t => t.trim().toLowerCase() === topic.toLowerCase())
    return { name, articles: articles.filter(a => a.tags?.some(t => t.trim().toLowerCase() === topic.toLowerCase())) }
}
export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }): Promise<Metadata> {
    const { name } = await lookup((await params).topic)
    return name ? { title: `${name} articles`, description: `Reporting, reviews and explainers about ${name} from Tech Hub.`, alternates: { canonical: `/topics/${topicSlug(name)}` } } : { title: "Topic not found", robots: { index: false } }
}
export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
    const { name, articles } = await lookup((await params).topic)
    if (!name) notFound()
    return <div className="site-container py-12"><nav aria-label="Breadcrumb" className="mb-8 text-sm"><Link href="/">Home</Link> / <Link href="/search">Explore</Link> / {name}</nav><p className="kicker text-brand-red">Topic collection</p><h1 className="mt-3 text-4xl font-bold">{name}</h1><ArticleCollection articles={articles} /></div>
}
