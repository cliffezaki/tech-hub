import { NextResponse } from "next/server"
import { authorized } from "@/lib/accounts"
import { listRecords } from "@/lib/platform-store"
import { getStore } from "@/lib/store"
import { validDate, previousPeriod, percentChange, summarize } from "@/lib/analytics-report"
import type { User } from "@/lib/permissions"
type Event = {
    kind: string
    visitor?: string
    country?: string
    region?: string
    path: string
    campaign: string
    placement: string
    device: string
    browser: string
    referrer: string
    at: string
}
export async function GET(request: Request) {
    const url = new URL(request.url)
    const ads = url.searchParams.get("ads") === "true"
    if (!(await authorized(ads ? "ads.analytics" : "analytics.view")))
        return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    try {
        const start =
            url.searchParams.get("start") ||
            new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
        const end =
            url.searchParams.get("end") || new Date().toISOString().slice(0, 10)
        if (
            !validDate(start) || !validDate(end) ||
            end < start || Date.parse(end) - Date.parse(start) > 730 * 86400000
        )
            return NextResponse.json(
                { error: "Invalid date range" },
                { status: 400 }
            )
        const all = await listRecords<Event>("events")
        const period = previousPeriod(start, end)
        const current = summarize(all, start, end, ads)
        const previous = summarize(all, period.start, period.end, ads)
        const change = (value: number, before: number) => ({ current: value, previous: before, percent: percentChange(value, before) })

        const events = all.filter(
            (e) =>
                e.at.slice(0, 10) >= start &&
                e.at.slice(0, 10) <= end &&
                (ads ? e.kind !== "view" : e.kind === "view")
        )
        const group = (key: keyof Event) =>
            Object.entries(
                events.reduce<Record<string, number>>((a, e) => {
                    const value = e[key] || "Unknown"
                    a[value] = (a[value] || 0) + 1
                    return a
                }, {})
            )
                .map(([name, count]) => ({ name, count }))
                .sort((a, b) => b.count - a.count)
        const clicks = events.filter((e) => e.kind === "click").length
        const impressions = events.filter((e) => e.kind === "impression").length
        const campaignRows = [...new Set(events.map((e) => e.campaign))]
            .filter(Boolean)
            .map((name) => ({
                name,
                impressions: events.filter(
                    (e) => e.campaign === name && e.kind === "impression"
                ).length,
                clicks: events.filter(
                    (e) => e.campaign === name && e.kind === "click"
                ).length,
            }))
        const articles = await getStore().listArticles()
        const authors: Record<string, number> = {}
        for (const event of events) {
            const article = articles.find(
                (a) => event.path === `/${a.section}/${a.slug}`
            )
            if (article)
                authors[article.author] = (authors[article.author] || 0) + 1
        }
        let subscriberGrowth: number | null = null
        if (!ads && (await authorized("subscribers.manage")))
            subscriberGrowth = (await listRecords<User>("users")).filter(
                (u) =>
                    u.subscribed &&
                    u.createdAt.slice(0, 10) >= start &&
                    u.createdAt.slice(0, 10) <= end
            ).length
        if (url.searchParams.get("export") === "csv") {
            if (!ads || !(await authorized("ads.export")))
                return NextResponse.json(
                    { error: "Export permission required" },
                    { status: 403 }
                )
            const csv = [
                "campaign,impressions,clicks,ctr_percent",
                ...campaignRows.map(
                    (r) =>
                        `${r.name.replace(/[^a-zA-Z0-9_-]/g, "")},${r.impressions},${r.clicks},${r.impressions ? ((r.clicks / r.impressions) * 100).toFixed(2) : 0}`
                ),
            ].join("\n")
            return new Response(csv, {
                headers: {
                    "Content-Type": "text/csv",
                    "Content-Disposition":
                        'attachment; filename="campaign-performance.csv"',
                },
            })
        }
        return NextResponse.json(
            {
                start,
                end,
                total: events.length,
                // Individual browsers are deliberately not identified or counted.
                visitors: null,
                newVisitors: null,
                returning: null,
                measurementMode: "anonymous",
                countries: group("country"),
                regions: group("region"),
                impressions,
                clicks,
                ctr: impressions ? (clicks / impressions) * 100 : 0,
                daily: current.daily,
                previousDaily: previous.daily,
                comparison: {
                    start: period.start, end: period.end,
                    views: change(current.total, previous.total),
                    pages: change(current.pages.length, previous.pages.length),
                    countries: change(current.countries.filter(r => r.name !== "Unknown").length, previous.countries.filter(r => r.name !== "Unknown").length),
                    clicks: change(current.clicks, previous.clicks),
                    impressions: change(current.impressions, previous.impressions),
                },
                content: current.pages.map(row => {
                    const article = articles.find(a => row.name === `/${a.section}/${a.slug}`)
                    const before = previous.pages.find(p => p.name === row.name)?.count || 0
                    return { ...row, title: article?.title || (row.name === "/" ? "Homepage" : row.name),
                        section: article?.section || "page", previous: before,
                        percent: percentChange(row.count, before), engagement: null }
                }),
                pages: group("path"),
                devices: group("device"),
                browsers: group("browser"),
                referrers: group("referrer"),
                placements: group("placement"),
                campaigns: campaignRows,
                authors: Object.entries(authors).map(([name, count]) => ({
                    name,
                    count,
                })),
                subscriberGrowth,
            },
            { headers: { "Cache-Control": "no-store" } }
        )
    } catch {
        return NextResponse.json(
            { error: "Analytics storage is not configured or is unavailable." },
            { status: 503 }
        )
    }
}
