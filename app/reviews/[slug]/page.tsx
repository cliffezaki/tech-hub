import { ArticleDetailPage } from "@/components/article-detail-page"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function ReviewArticlePage({ params }: PageProps) {
    const { slug } = await params

    return (
        <ArticleDetailPage
            section="reviews"
            slug={slug}
            backHref="/reviews"
            backLabel="Back to Reviews"
            moreLabel="More Smartphone Reviews"
            showRating
        />
    )
}
