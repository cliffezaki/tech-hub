import { ArticleDetailPage } from "@/components/article-detail-page"

interface PageProps {
    params: Promise<{ slug: string }>
}

export default async function HowToArticlePage({ params }: PageProps) {
    const { slug } = await params

    return (
        <ArticleDetailPage
            section="how-to"
            slug={slug}
            backHref="/how-to"
            backLabel="Back to How To Guides"
            moreLabel="More Tutorials"
        />
    )
}
