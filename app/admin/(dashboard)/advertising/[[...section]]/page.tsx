import Link from "next/link"
import { currentUser, userPermissions } from "@/lib/accounts"
import { redirect, notFound } from "next/navigation"
import { MODULES, type RecordData } from "@/lib/modules"
import { RecordManager } from "@/components/admin/record-manager"
import { AnalyticsDashboard } from "@/components/admin/analytics-dashboard"
import { listRecords } from "@/lib/platform-store"
const sections = [
    "campaigns",
    "advertisers",
    "placements",
    "creatives",
    "inquiries",
    "packages",
    "revenue",
    "reports",
    "advertising",
]
export default async function Advertising({
    params,
}: {
    params: Promise<{ section?: string[] }>
}) {
    const user = await currentUser()
    if (!user) redirect("/account")
    const permissions = await userPermissions(user)
    const section = (await params).section?.[0]
    if (section && !sections.includes(section)) notFound()
    const allowed = sections.filter((s) =>
        permissions.includes(
            s === "reports" ? "ads.analytics" : MODULES[s].permission
        )
    )
    if (!allowed.length || (section && !allowed.includes(section)))
        return <p>You do not have access to this section.</p>
    const campaigns = permissions.includes("ads.campaigns")
        ? await listRecords<RecordData>("campaigns")
        : []
    const inquiries = permissions.includes("ads.inquiries")
        ? await listRecords<RecordData>("inquiries")
        : []
    const today = new Date().toISOString().slice(0, 10)
    return (
        <div className="space-y-6">
            <nav className="flex flex-wrap gap-2 border-b pb-4">
                <Link
                    href="/admin/advertising"
                    className="rounded border px-3 py-2 text-sm"
                >
                    Overview
                </Link>
                {allowed.map((s) => (
                    <Link
                        className="rounded border px-3 py-2 text-sm"
                        href={`/admin/advertising/${s}`}
                        key={s}
                    >
                        {s === "advertising"
                            ? "Settings"
                            : s === "reports"
                              ? "Reports"
                              : MODULES[s].title}
                    </Link>
                ))}
            </nav>
            {section === "reports" ? (
                <AnalyticsDashboard ads />
            ) : section ? (
                <RecordManager resource={section} />
            ) : (
                <>
                    <h1 className="text-3xl font-bold">Advertising</h1>
                    <p className="text-muted-foreground">
                        Manage direct partnerships, campaigns and the inventory
                        that supports your publication.
                    </p>
                    <div className="grid gap-4 sm:grid-cols-3">
                        {[
                            [
                                "Active campaigns",
                                campaigns.filter(
                                    (c) =>
                                        ["active", "scheduled"].includes(
                                            String(c.status)
                                        ) &&
                                        String(c.start) <= today &&
                                        String(c.end) >= today
                                ).length,
                            ],
                            [
                                "Upcoming campaigns",
                                campaigns.filter(
                                    (c) =>
                                        ["active", "scheduled"].includes(
                                            String(c.status)
                                        ) && String(c.start) > today
                                ).length,
                            ],
                            [
                                "New inquiries",
                                inquiries.filter((i) => i.status === "new")
                                    .length,
                            ],
                        ].map(([label, count]) => (
                            <div
                                key={String(label)}
                                className="rounded-xl border bg-background p-6"
                            >
                                <p className="text-muted-foreground">{label}</p>
                                <p className="mt-3 text-3xl font-bold">
                                    {count}
                                </p>
                            </div>
                        ))}
                    </div>
                    <p className="rounded-xl border p-6">
                        Create an advertiser, a placement, and a creative, then
                        connect them in a campaign. Use the record IDs shown in
                        each list. Published campaigns display automatically
                        within their scheduled dates.
                    </p>
                </>
            )}
        </div>
    )
}
