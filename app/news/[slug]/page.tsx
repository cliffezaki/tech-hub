import { ArticleDetailPage } from "@/components/article-detail-page"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function NewsArticlePage({ params }: PageProps) {
    const { slug } = await params

    return (
        <ArticleDetailPage
            section="news"
            slug={slug}
            backHref="/news"
            backLabel="Back to News"
            moreLabel="More News Articles"
        />
    )
}
