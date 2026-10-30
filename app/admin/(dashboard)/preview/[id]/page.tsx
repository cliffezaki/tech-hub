import { notFound } from "next/navigation"
import { currentUser, userPermissions } from "@/lib/accounts"
import { getStore } from "@/lib/store"
import { Markdown } from "@/components/markdown"
export default async function Preview({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const user = await currentUser()
    if (!user) notFound()
    const permissions = await userPermissions(user)
    const article = await getStore().getArticle((await params).id)
    if (
        !article ||
        !(
            permissions.includes("articles.editAll") ||
            (permissions.includes("articles.editOwn") &&
                article.ownerId === user.id)
        )
    )
        notFound()
    return (
        <article className="mx-auto max-w-3xl space-y-6">
            <p className="rounded border p-3 text-sm">
                Private preview · {article.status} · only visible to authorized
                team members
            </p>
            {article.sponsorship && (
                <p className="font-semibold">{article.sponsorship}</p>
            )}
            <h1 className="text-4xl font-bold">{article.title}</h1>
            <p className="text-xl text-muted-foreground">{article.excerpt}</p>
            <p>{article.author}</p>
            <Markdown content={article.content} />
        </article>
    )
}
