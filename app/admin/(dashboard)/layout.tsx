import { AdminShell } from "@/components/admin/admin-shell"
import { currentUser, userPermissions } from "@/lib/accounts"
import { redirect } from "next/navigation"

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const user = await currentUser()
    if (!user) redirect("/account")
    const permissions = await userPermissions(user)
    if (!permissions.length) redirect("/account")
    return <AdminShell permissions={permissions}>{children}</AdminShell>
}
