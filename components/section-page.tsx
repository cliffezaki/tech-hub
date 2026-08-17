import { ArticleCard } from "@/components/article-card"
import { ArticleGrid } from "@/components/article-grid"
import { HeroSection } from "@/components/hero-section"
import { SectionHeading } from "@/components/section-heading"
import { getSectionArticles } from "@/lib/content"
import type { ArticleSection } from "@/lib/types"

interface SectionPageProps {
    section: ArticleSection
    title: string
    subtitle: string
}

export async function SectionPage({ section, title, subtitle }: SectionPageProps) {
    const articles = await getSectionArticles(section)
    const featuredArticle = articles[0]
    const topStories = articles.slice(1, 3)
    const gridArticles = articles.length > 3 ? articles.slice(3) : articles.slice(1)

    return (
        <div className="container mx-auto max-w-7xl px-4 py-12">
            <SectionHeading title={title} subtitle={subtitle} />

            {featuredArticle && (
                <HeroSection featuredArticle={featuredArticle} topStories={topStories} />
            )}

            <ArticleGrid>
                {gridArticles.map((article) => (
                    <ArticleCard
                        key={article.id}
                        title={article.title}
                        excerpt={article.excerpt}
                        category={article.category}
                        author={article.author}
                        readTime={article.readTime}
                        href={article.href}
                        imageUrl={article.imageUrl}
                    />
                ))}
            </ArticleGrid>
        </div>
    )
}
