import type { Metadata } from "next"

import { ArticleDetailPage } from "@/components/article-detail-page"
import { buildArticleMetadata } from "@/lib/article-page"

export const dynamic = "force-dynamic"

const SECTION = "how-stuff-works" as const

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    return buildArticleMetadata(SECTION, slug)
}

export default async function Page({ params }: PageProps) {
    const { slug } = await params
    return <ArticleDetailPage section={SECTION} slug={slug} />
}
