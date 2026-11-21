import { authorized } from "@/lib/accounts"
export default async function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    if (!(await authorized("media.manage")))
        return <p>You do not have access to this section.</p>
    return <>{children}</>
}
