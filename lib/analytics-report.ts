export type Measurement = {
    kind: string; at: string; path: string; country?: string; region?: string;
    referrer?: string; device?: string; browser?: string; campaign?: string; placement?: string;
}
export type CountRow = { name: string; count: number }
export const DAY = 86400000
export function validDate(value: string) {
    return /^\d{4}-\d{2}-\d{2}$/.test(value) &&
        Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0, 10) === value
}
export function previousPeriod(start: string, end: string) {
    const days = Math.round((Date.parse(end) - Date.parse(start)) / DAY) + 1
    return { start: new Date(Date.parse(start) - days * DAY).toISOString().slice(0, 10),
        end: new Date(Date.parse(start) - DAY).toISOString().slice(0, 10), days }
}
export function percentChange(current: number, previous: number): number | null {
    return previous ? ((current - previous) / previous) * 100 : current ? null : 0
}
export function summarize(events: Measurement[], start: string, end: string, ads = false) {
    const rows = events.filter(e => typeof e.at === "string" && e.at.slice(0,10) >= start && e.at.slice(0,10) <= end &&
        (ads ? e.kind === "click" || e.kind === "impression" : e.kind === "view"))
    const group = (field: keyof Measurement): CountRow[] => Object.entries(rows.reduce<Record<string,number>>((counts,e) => {
        const value = String(e[field] || "Unknown"); counts[value] = (counts[value] || 0) + 1; return counts
    },{})).map(([name,count])=>({name,count})).sort((a,b)=>b.count-a.count || a.name.localeCompare(b.name))
    const days: CountRow[] = []
    const counts = rows.reduce<Record<string,number>>((a,e)=>{const day=e.at.slice(0,10);a[day]=(a[day]||0)+1;return a},{})
    for (let time=Date.parse(start); time<=Date.parse(end); time+=DAY) {
        const name = new Date(time).toISOString().slice(0,10); days.push({name,count:counts[name]||0})
    }
    return { total: rows.length, pages:group("path"), countries:group("country"), regions:group("region"),
        devices:group("device"), browsers:group("browser"), referrers:group("referrer"), daily:days,
        clicks:rows.filter(e=>e.kind==="click").length, impressions:rows.filter(e=>e.kind==="impression").length }
}
export type DatePreset = "today" | "yesterday" | "7" | "30" | "90" | "month" | "year" | "custom"
export function presetRange(preset: DatePreset, now = new Date()) {
    const end = now.toISOString().slice(0,10), date = Date.parse(end)
    if (preset === "yesterday") { const day = new Date(date-DAY).toISOString().slice(0,10);return {start:day,end:day} }
    return { start: preset === "today" ? end : preset === "month" ? `${end.slice(0,7)}-01` :
        preset === "year" ? `${end.slice(0,4)}-01-01` : new Date(date-(preset === "7" ? 6 : preset === "90" ? 89 : 29)*DAY).toISOString().slice(0,10), end }
}

export type VisitorMeasurement = Measurement & { visitor?: string; browserId?: string; measurementVersion?: number; id?: string }
const browserKey = (row:VisitorMeasurement) => row.measurementVersion === 2 && /^[a-f0-9]{64}$/.test(row.browserId || "") ? row.browserId! : null
/** Browser estimates are never mixed with the older consent-based identifier population. */
export function visitorSummary(all:VisitorMeasurement[], start:string, end:string) {
    const views=all.filter(r=>r.kind==="view" && validDate(r.at?.slice(0,10)))
    const current=views.filter(r=>r.at.slice(0,10)>=start&&r.at.slice(0,10)<=end)
    const identified=current.filter(r=>browserKey(r))
    const modern=views.filter(r=>browserKey(r))
    const legacy=views.filter(r=>!browserKey(r)&&/^[a-f0-9-]{36}$/i.test(r.visitor||""))
    const startedAt=modern.map(r=>r.at.slice(0,10)).sort()[0]||null
    const countries = new Map<string,Set<string>>()
    for(const row of identified){const country=row.country||"Unknown";if(!countries.has(country))countries.set(country,new Set());countries.get(country)!.add(browserKey(row)!)}
    return {count:identified.length?new Set(identified.map(browserKey)).size:startedAt&&start>=startedAt?0:null,
        identifiedViews:identified.length,totalViews:current.length,startedAt,
        countries:[...countries].map(([name,ids])=>({name,count:ids.size})).sort((a,b)=>b.count-a.count||a.name.localeCompare(b.name)),
        audit:{totalPageViews:views.length,legacyIdentifiedViews:legacy.length,legacyUniqueBrowsers:new Set(legacy.map(r=>r.visitor)).size,
            legacyStart:legacy.map(r=>r.at.slice(0,10)).sort()[0]||null,legacyEnd:legacy.map(r=>r.at.slice(0,10)).sort().at(-1)||null,
            modernIdentifiedViews:modern.length,unidentifiedViews:views.length-legacy.length-modern.length,
            firstPageView:views.map(r=>r.at.slice(0,10)).sort()[0]||null}}
}
