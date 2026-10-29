import { notFound } from "next/navigation"
import { authorized } from "@/lib/accounts"
import { MODULES } from "@/lib/modules"
import { RecordManager } from "@/components/admin/record-manager"
import { UserManager } from "@/components/admin/user-manager"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { NavigationManager } from "@/components/admin/navigation-manager"
export default async function ModulePage({
    params,
}: {
    params: Promise<{ module: string }>
}) {
    const { module } = await params
    const permission =
        module === "users"
            ? "users.manage"
            : module === "subscribers"
              ? "subscribers.manage"
              : module === "analytics"
                ? "analytics.view"
                : MODULES[module]?.permission
    if (!permission) notFound()
    if (!(await authorized(permission)))
        return <p>You do not have access to this section.</p>
    if (module === "users" || module === "subscribers")
        return <UserManager subscribersOnly={module === "subscribers"} />
    if (module === "analytics") return <><nav className="flex gap-4" aria-label="Analytics management">{await authorized("comments.moderate") && <a href="/admin/analytics/comments">Comments</a>}{await authorized("subscribers.manage") && <a href="/admin/analytics/subscribers">Subscribers</a>}</nav><AnalyticsDashboard /></>
    if (module === "navigation") return <NavigationManager />
    return <RecordManager resource={module} />
}
