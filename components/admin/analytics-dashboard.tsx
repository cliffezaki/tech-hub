"use client"
import { useEffect, useState } from "react"
type Row = { name: string; count: number }
type Report = {
    total: number
    visitors: null
    newVisitors: null
    returning: null
    countries: Row[]
    regions: Row[]
    impressions: number
    clicks: number
    ctr: number
    daily: Row[]
    pages: Row[]
    devices: Row[]
    browsers: Row[]
    referrers: Row[]
    placements: Row[]
    authors: Row[]
    subscriberGrowth: number | null
    campaigns: { name: string; impressions: number; clicks: number }[]
}
function geographyLabel(title: string, name: string) {
    if (title.startsWith("Countries") && /^[A-Z]{2}$/.test(name)) {
        try { return new Intl.DisplayNames(["en"], { type: "region" }).of(name) || name } catch { return name }
    }
    return name
}
export function AnalyticsDashboard({ ads = false }: { ads?: boolean }) {
    const [start, setStart] = useState(() =>
        new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10)
    )
    const [end, setEnd] = useState(new Date().toISOString().slice(0, 10))
    const [report, setReport] = useState<Report | null>(null)
    const [error, setError] = useState("")
    const query = `ads=${ads}&start=${start}&end=${end}`
    useEffect(() => {
        let active = true
        fetch(`/api/analytics?${query}`)
            .then(async (r) => {
                const d = await r.json()
                if (!r.ok) throw new Error(d.error)
                if (active) {
                    setReport(d)
                    setError("")
                }
            })
            .catch((e) => {
                if (active) {
                    setError(e.message)
                    setReport(null)
                }
            })
        return () => {
            active = false
        }
    }, [query])
    return (
        <div className="space-y-6">
            <div>
                <p className="kicker text-brand-red">Measured activity</p>
                <h1 className="mt-2 text-3xl font-bold">
                    {ads ? "Advertising reports" : "Audience analytics"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                    Anonymous first-party page views without tracking cookies or
                    persistent browser IDs. Page views include repeat visits;
                    they are not unique people. Ad blockers and privacy preferences
                    can reduce coverage. These are not audited billing figures.
                </p>
            </div>
            <div className="flex flex-wrap items-end gap-4">
                <label>
                    Period
                    <select
                        className="cms-input"
                        defaultValue="30"
                        onChange={(e) => {
                            if (e.target.value !== "custom") {
                                setStart(
                                    new Date(
                                        Date.now() -
                                            (Number(e.target.value) - 1) *
                                                86400000
                                    )
                                        .toISOString()
                                        .slice(0, 10)
                                )
                                setEnd(new Date().toISOString().slice(0, 10))
                            }
                        }}
                    >
                        <option value="1">Today</option>
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="90">90 days</option>
                        <option value="custom">Custom</option>
                    </select>
                </label>
                <label>
                    From
                    <input
                        className="cms-input"
                        type="date"
                        value={start}
                        onChange={(e) => setStart(e.target.value)}
                    />
                </label>
                <label>
                    Through
                    <input
                        className="cms-input"
                        type="date"
                        value={end}
                        onChange={(e) => setEnd(e.target.value)}
                    />
                </label>
                {ads && (
                    <a
                        className="cms-primary"
                        href={`/api/analytics?${query}&export=csv`}
                    >
                        Export campaign CSV
                    </a>
                )}
            </div>
            {error && (
                <p role="alert" className="rounded border p-5">
                    {error}
                </p>
            )}
            {report && (
                <>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {(ads
                            ? [
                                  ["Impressions", report.impressions],
                                  ["Clicks", report.clicks],
                                  [
                                      "Click-through rate",
                                      `${report.ctr.toFixed(2)}%`,
                                  ],
                              ]
                            : [
                                  ["Page views", report.total],
                                  ["Pages read", report.pages.length],
                                  ["Countries", report.countries.filter(r => r.name !== "Unknown").length],
                                  ["Traffic sources", report.referrers.length],
                              ]
                        ).map(([label, value]) => (
                            <div
                                key={String(label)}
                                className="rounded-xl border bg-background p-5"
                            >
                                <p className="text-sm text-muted-foreground">
                                    {label}
                                </p>
                                <p className="mt-3 text-3xl font-bold">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </div>
                    {!report.total && (
                        <p className="rounded-xl border border-dashed p-8 text-center">
                            No recorded activity in this period. Check that
                            anonymous analytics is enabled in Publishing & privacy
                            settings. Measurements appear after readers visit.
                        </p>
                    )}
                    <div className="grid gap-5 md:grid-cols-2">
                        {(
                            [
                                ["Activity over time", report.daily],
                                ["Pages", report.pages],
                                ["Devices", report.devices],
                                ["Browsers", report.browsers],
                                ["Traffic sources", report.referrers],
                                ["Countries (approximate)", report.countries],
                                ["Regions (approximate)", report.regions],
                                [
                                    ads ? "Placements" : "Author page views",
                                    ads ? report.placements : report.authors,
                                ],
                            ] as [string, Row[]][]
                        ).map(([title, rows]) => (
                            <section
                                key={title}
                                className="rounded-xl border bg-background p-5"
                            >
                                <h2 className="mb-4 font-semibold">{title}</h2>
                                {rows.length ? (
                                    rows.slice(0, 20).map((row) => (
                                        <div
                                            key={row.name}
                                            className="flex justify-between gap-3 border-t py-2 text-sm"
                                        >
                                            <span className="break-all">
                                                {geographyLabel(title, row.name)}
                                            </span>
                                            <span>{row.count}</span>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No measurements yet.
                                    </p>
                                )}
                            </section>
                        ))}
                    </div>
                    {!ads && (
                        <p className="rounded border p-4 text-sm text-muted-foreground">
                            Country and region are approximate network locations,
                            not GPS locations. VPNs and mobile networks can affect
                            accuracy. Unknown means location was unavailable or the
                            visit predates anonymous analytics. Unique people,
                            returning visitors, age and gender are not measured.{" "}
                            {report.subscriberGrowth !== null &&
                                `${report.subscriberGrowth} currently subscribed accounts were created in this period.`}
                        </p>
                    )}
                    {ads &&
                        report.campaigns.map((c) => (
                            <p
                                key={c.name}
                                className="rounded border p-4 text-sm"
                            >
                                Campaign {c.name}: {c.impressions} impressions ·{" "}
                                {c.clicks} clicks
                            </p>
                        ))}
                </>
            )}
        </div>
    )
}
