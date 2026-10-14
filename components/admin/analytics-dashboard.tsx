"use client"
import { useEffect, useState } from "react"
type Row = { name: string; count: number }
type Report = {
    total: number
    visitors: number
    newVisitors: number
    returning: number
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
                    Consent-based first-party measurements. Ad blockers and
                    declined consent reduce coverage. These are not audited
                    billing figures.
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
                                  ["Unique browsers", report.visitors],
                                  ["New browsers", report.newVisitors],
                                  ["Returning browsers", report.returning],
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
                            No recorded activity in this period. Enable
                            analytics in Publishing & privacy settings; data
                            appears after visitors consent.
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
                                                {row.name}
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
                            Geography, demographic and engagement data are
                            unavailable. No location or demographics are
                            inferred.{" "}
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
