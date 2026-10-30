import { ArticleForm } from "@/components/admin/article-form"
import { publishingConfig } from "@/lib/advertising"
import { currentUser, userPermissions } from "@/lib/accounts"

export default async function NewArticlePage() {
    const settings = await publishingConfig(); const user = await currentUser()
    const permissions = user ? await userPermissions(user) : []
    if (!permissions.includes("articles.create")) return <p>You do not have permission to create articles.</p>
    return <ArticleForm permissions={permissions} defaults={{ author: String(settings?.defaultAuthor || user?.name || ""), category: String(settings?.defaultCategory || "") }} />
}
