import type { Metadata } from "next"

import { ArticleDetailPage } from "@/components/article-detail-page"
import { buildArticleMetadata, generateSectionStaticParams } from "@/lib/article-page"

const SECTION = "reviews" as const

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
    return generateSectionStaticParams(SECTION)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    return buildArticleMetadata(SECTION, slug)
}

export default async function Page({ params }: PageProps) {
    const { slug } = await params
    return <ArticleDetailPage section={SECTION} slug={slug} />
}
