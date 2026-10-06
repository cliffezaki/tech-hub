import { notFound } from "next/navigation"
import { authorized } from "@/lib/accounts"
import { MODULES } from "@/lib/modules"
import { RecordManager } from "@/components/admin/record-manager"
import { UserManager } from "@/components/admin/user-manager"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
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
    if (module === "analytics") return <AnalyticsDashboard />
    return <RecordManager resource={module} />
}
