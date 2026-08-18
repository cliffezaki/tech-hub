import Link from "next/link"

import { ArticleForm } from "@/components/admin/article-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getStore } from "@/lib/store"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: PageProps) {
    const { id } = await params
    const article = await getStore().getArticle(id)

    if (!article) {
        return (
            <Card className="p-10 text-center">
                <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Article not found</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                    It may have been deleted, or the link is out of date.
                </p>
                <Link href="/admin/articles" className="mt-4 inline-block">
                    <Button variant="outline">Back to articles</Button>
                </Link>
            </Card>
        )
    }

    return <ArticleForm initialData={article} isEditing />
}
