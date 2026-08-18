import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { Markdown } from "@/components/markdown"
import { getPublishedPage, getPublishedPages } from "@/lib/content"
import { formatDate } from "@/lib/format"

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
    try {
        const pages = await getPublishedPages()
        return pages.map((page) => ({ slug: page.slug }))
    } catch {
        return []
    }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const page = await getPublishedPage(slug)

    if (!page) {
        return { title: "Page not found" }
    }

    return {
        title: page.title,
        description: page.excerpt,
        alternates: { canonical: `/${page.slug}` },
    }
}

/** Renders any page created in the dashboard, e.g. /about or /advertise. */
export default async function CmsPage({ params }: PageProps) {
    const { slug } = await params
    const page = await getPublishedPage(slug)

    if (!page) {
        notFound()
    }

    return (
        <div className="site-container py-12 md:py-16">
            <article className="mx-auto max-w-3xl">
                <header className="border-b pb-6">
                    <h1 className="text-4xl font-black tracking-tight md:text-5xl">{page.title}</h1>
                    {page.excerpt && <p className="mt-4 text-lg text-muted-foreground">{page.excerpt}</p>}
                    <p className="mt-4 text-sm text-muted-foreground">Last updated {formatDate(page.updatedAt)}</p>
                </header>

                <div className="mt-8">
                    <Markdown content={page.content} />
                </div>
            </article>
        </div>
    )
}
