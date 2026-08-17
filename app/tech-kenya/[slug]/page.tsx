import { ArticleDetailPage } from "@/components/article-detail-page"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function TechKenyaArticlePage({ params }: PageProps) {
    const { slug } = await params

    return (
        <ArticleDetailPage
            section="tech-kenya"
            slug={slug}
            backHref="/tech-kenya"
            backLabel="Back to Tech Kenya"
            moreLabel="More Tech Kenya Stories"
        />
    )
}
