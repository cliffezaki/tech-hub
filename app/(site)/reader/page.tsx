import { redirect } from "next/navigation"
import { currentUser } from "@/lib/accounts"
import { getAllArticleSummaries } from "@/lib/content"
import { ReaderDashboard } from "@/components/reader-dashboard"
export const metadata = { title: "Your reading list", robots: { index: false, follow: false } }
export default async function ReaderPage() {
    const user = await currentUser()
    if (!user) redirect("/account")
    return <ReaderDashboard name={user.name} articles={await getAllArticleSummaries()} />
}
