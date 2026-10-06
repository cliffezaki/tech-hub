import { ArticleForm } from "@/components/admin/article-form"
import { publishingConfig } from "@/lib/advertising"
import { currentUser } from "@/lib/accounts"

export default async function NewArticlePage() {
    const settings = await publishingConfig(); const user = await currentUser()
    return <ArticleForm defaults={{ author: String(settings?.defaultAuthor || user?.name || ""), category: String(settings?.defaultCategory || "") }} />
}
