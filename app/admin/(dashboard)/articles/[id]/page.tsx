import Link from "next/link"

import { ArticleForm } from "@/components/admin/article-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getStore } from "@/lib/store"
import { currentUser, userPermissions } from "@/lib/accounts"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditArticlePage({ params }: PageProps) {
    const { id } = await params
    const article = await getStore().getArticle(id)
    const user = await currentUser()
    const permissions = user ? await userPermissions(user) : []
    if (
        !user ||
        (!permissions.includes("articles.editAll") &&
            article?.ownerId !== user.id)
    )
        return <p>You do not have permission to edit this article.</p>

    if (!article) {
        return (
            <Card className="p-10 text-center">
                <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">
                    Article not found
                </h1>
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
