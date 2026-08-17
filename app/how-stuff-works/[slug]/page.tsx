import { ArticleDetailPage } from "@/components/article-detail-page"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function HowStuffWorksArticlePage({ params }: PageProps) {
    const { slug } = await params

    return (
        <ArticleDetailPage
            section="how-stuff-works"
            slug={slug}
            backHref="/how-stuff-works"
            backLabel="Back to How Stuff Works"
            moreLabel="More Explainers"
        />
    )
}
