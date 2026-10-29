"use client"
import { CountryFlag } from "./country-flag"
import type { visitorSummary } from "@/lib/analytics-report"
import { CountryMap } from "./country-map"
import { useEffect, useId, useState, type ReactNode } from "react"
import { Activity, ArrowDownRight, ArrowUpRight, CalendarDays, ChartNoAxesColumn, ChevronRight, Eye, FileText, Globe2, Info, MousePointer2, RefreshCw, Users } from "lucide-react"
import { presetRange, type DatePreset, type CountRow } from "@/lib/analytics-report"
import styles from "./analytics-dashboard.module.css"
type Change = { current: number; previous: number; percent: number | null }
type Content = CountRow & { title: string; section: string; previous: number; percent: number | null; engagement: null; likes: number; comments: number }
type Report = {
    visitorData:ReturnType<typeof visitorSummary>; previousVisitors:ReturnType<typeof visitorSummary>;
    engagementDaily:CountRow[]; previousEngagementDaily:CountRow[];
    engagement: {likes:number;comments:number}; publishedArticles:number;
    start: string; end: string; total: number; visitors: number|null; countries: CountRow[]; regions: CountRow[];
    impressions: number; clicks: number; ctr: number; daily: CountRow[]; previousDaily: CountRow[];
    pages: CountRow[]; devices: CountRow[]; browsers: CountRow[]; referrers: CountRow[]; placements: CountRow[];
    authors: CountRow[]; subscriberGrowth: number | null; content: Content[];
    comparison: { start: string; end: string; views: Change; pages: Change; countries: Change; clicks: Change; impressions: Change };
    campaigns: { name: string; impressions: number; clicks: number }[]
}
const format = (n: number) => new Intl.NumberFormat("en").format(n)
const dateLabel = (s: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(s))
const presets: [DatePreset,string][] = [["today","Today"],["yesterday","Yesterday"],["7","Last 7 Days"],["30","Last 30 Days"],["90","Last 90 Days"],["month","This Month"],["year","This Year"],["custom","Custom Date Range"]]
function countryName(code: string) { try { return /^[A-Z]{2}$/.test(code) ? new Intl.DisplayNames(["en"],{type:"region"}).of(code) || code : code } catch { return code } }
function Delta({ change }: { change: Change }) {
    if (change.percent === null) return <span className={styles.baseline}>No previous baseline</span>
    const up = change.percent > 0, down = change.percent < 0
    return <span className={`${styles.delta} ${up ? styles.positive : down ? styles.negative : ""}`}>
        {up ? <ArrowUpRight size={13}/> : down ? <ArrowDownRight size={13}/> : null}
        {Math.abs(change.percent).toLocaleString("en",{maximumFractionDigits:1})}% <span>vs previous period</span>
    </span>
}
function Panel({ title, note, action, children, className = "" }: { title: string; note?: string; action?: ReactNode; children: ReactNode; className?: string }) {
    return <section className={`${styles.panel} ${className}`}><div className={styles.panelHead}><div><h2>{title}</h2>{note && <p>{note}</p>}</div>{action}</div>{children}</section>
}
function Empty({ children = "No measurements in this period." }: { children?: ReactNode }) { return <div className={styles.empty}><ChartNoAxesColumn size={24}/><p>{children}</p></div> }
function Bars({ rows, total, countries = false, color = "red" }: { rows: CountRow[]; total: number; countries?: boolean; color?: string }) {
    if (!rows.length) return <Empty/>
    return <div className={styles.barList}>{rows.slice(0,countries?rows.length:7).map((r,i)=><div key={r.name} className={styles.barRow}>
        <div className={styles.barLabel}><span className="inline-flex items-center">{countries&&<CountryFlag code={r.name}/>} {r.name === "Unknown" ? "Location unavailable" : countries ? countryName(r.name) : r.name}</span><strong>{format(r.count)} <small>{total ? Math.round(r.count/total*100) : 0}%</small></strong></div>
        <div className={styles.track}><div className={`${styles.fill} ${color === "blue" ? styles.blue : ""}`} style={{width:`${total ? r.count/total*100 : 0}%`,opacity:Math.max(.45,1-i*.07)}}/></div>
    </div>)}</div>
}
function TrafficChart({ daily, previous, compare, mode, unit }: { daily: CountRow[]; previous: CountRow[]; compare: boolean; mode: string; unit: string }) {
    const id = useId().replace(/:/g, "")
    const [selected, setSelected] = useState<number | null>(null)
    const max = Math.max(1,...daily.map(r=>r.count),...(compare?previous.map(r=>r.count):[]))
    const upper = max <= 4 ? 4 : Math.ceil(max/4)*4
    const x = (i: number) => 46 + (daily.length > 1 ? i/(daily.length-1)*688 : 344)
    const y = (v: number) => 208 - v/upper*174
    const points = (rows: CountRow[]) => rows.map((r,i)=>`${x(i)},${y(r.count)}`).join(" ")
    const chosen = selected === null ? daily.length-1 : Math.min(selected,daily.length-1)
    const any = daily.some(r=>r.count) || (compare && previous.some(r=>r.count))
    return <>
        <div className={styles.chart}>
            <svg viewBox="0 0 766 250" role="img" aria-label={`Traffic from ${daily[0]?.name} through ${daily.at(-1)?.name}. Daily values available in the table below.`}
                onMouseMove={e=>{const box=e.currentTarget.getBoundingClientRect();setSelected(Math.max(0,Math.min(daily.length-1,Math.round(((e.clientX-box.left)/box.width*766-46)/688*(daily.length-1)))))}} onMouseLeave={()=>setSelected(null)}>
                <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".18"/><stop offset="100%" stopColor="currentColor" stopOpacity=".01"/></linearGradient></defs>
                {[0,1,2,3,4].map(n=><g key={n}><line x1="46" y1={y(upper*n/4)} x2="734" y2={y(upper*n/4)} className={styles.gridLine}/><text x="34" y={y(upper*n/4)+4} textAnchor="end" className={styles.axis}>{format(upper*n/4)}</text></g>)}
                {any && mode === "line" && <><polygon points={`46,208 ${points(daily)} 734,208`} fill={`url(#${id})`}/><polyline points={points(daily)} fill="none" stroke="currentColor" strokeWidth="2.7" strokeLinejoin="round"/>{daily.length===1&&<circle cx={x(0)} cy={y(daily[0].count)} r="5" fill="currentColor"/>}</>}
                {any && mode === "bar" && daily.map((r,i)=><rect key={r.name} x={x(i)-Math.min(18,240/daily.length)/2} y={y(r.count)} width={Math.min(18,240/daily.length)} height={208-y(r.count)} rx="2" fill="currentColor" opacity={selected===null||selected===i?1:.4}/>) }
                {compare && any && <polyline points={points(previous)} fill="none" stroke="var(--analytics-comparison)" strokeWidth="2" strokeDasharray="5 5"/>}
                {selected!==null && any && <><line x1={x(chosen)} x2={x(chosen)} y1="24" y2="208" stroke="currentColor" strokeDasharray="3 4" opacity=".4"/><circle cx={x(chosen)} cy={y(daily[chosen]?.count||0)} r="5" fill="currentColor" stroke="var(--analytics-surface)" strokeWidth="2"/></>}
                {[...new Set([0,Math.floor((daily.length-1)/2),daily.length-1])].map(i=><text key={i} x={x(i)} y="238" textAnchor="middle" className={styles.axis}>{dateLabel(daily[i].name)}</text>)}
            </svg>
            {!any && <div className={styles.chartEmpty}><strong>No {unit === "interactions" ? "interactions" : "traffic"} recorded</strong><span>Choose another period or check back after readers visit.</span></div>}
        </div>
        <div className={styles.chartReadout}><span><strong>{dateLabel(daily[chosen]?.name)}</strong> · {format(daily[chosen]?.count||0)} {unit}{compare && <> · Previous: {format(previous[chosen]?.count||0)}</>}</span><input aria-label="Inspect traffic day" type="range" min="0" max={Math.max(0,daily.length-1)} value={chosen} onChange={e=>setSelected(Number(e.target.value))}/></div>
        <details className={styles.dataDetails}><summary>View daily data</summary><div className={styles.tableScroll}><table><thead><tr><th>Date (UTC)</th><th>Selected period</th><th>Previous date</th><th>Previous period</th></tr></thead><tbody>{daily.map((r,i)=><tr key={r.name}><td>{r.name}</td><td>{format(r.count)}</td><td>{previous[i]?.name}</td><td>{format(previous[i]?.count||0)}</td></tr>)}</tbody></table></div></details>
    </>
}
export function AnalyticsDashboard({ ads = false }: { ads?: boolean }) {
    const [preset,setPreset] = useState<DatePreset>("30")
    const [range,setRange] = useState(()=>presetRange("30"))
    const [custom,setCustom] = useState(range)
    const [report,setReport] = useState<Report|null>(null)
    const [error,setError] = useState("")
    const [loading,setLoading] = useState(true)
    const [refresh,setRefresh] = useState(0)
    const [compare,setCompare] = useState(true)
    const [chartMode,setChartMode] = useState("line")
    const [countryMetric,setCountryMetric] = useState("views")
    const [countryOrder,setCountryOrder] = useState("count")
    const [geography,setGeography] = useState("countries")
    const [search,setSearch] = useState("")
    const query = `ads=${ads}&start=${range.start}&end=${range.end}`
    useEffect(()=>{
        const controller = new AbortController()
        setLoading(true);setError("");setReport(null)
        fetch(`/api/analytics?${query}`,{signal:controller.signal,cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error||"Could not load analytics");if(!controller.signal.aborted)setReport(d)})
            .catch(e=>{if(!controller.signal.aborted)setError(e.message)}).finally(()=>{if(!controller.signal.aborted)setLoading(false)})
        return ()=>controller.abort()
    },[query,refresh])
    const filtered = report?.content.filter(r=>`${r.title} ${r.name}`.toLowerCase().includes(search.toLowerCase())) || []
    const uniqueCountries = !ads && (countryMetric === "visitors" || (countryMetric === "auto" && report?.visitors !== null))
    const countryRows = [...(uniqueCountries ? report?.visitorData.countries || [] : report?.countries || [])].sort((a,b)=>countryOrder==="name"?countryName(a.name).localeCompare(countryName(b.name)):b.count-a.count)
    const countryUnit = uniqueCountries ? "approx. unique browsers" : "page views"
    const primary = ads ? report?.impressions || 0 : report?.total || 0
    const metric = report ? [
        {label:ads?"Ad impressions":"Page views",value:format(primary),icon:Eye,change:ads?report.comparison.impressions:report.comparison.views,note:ads?"Recorded ad displays":"Every recorded page read",featured:true},
        {label:ads?"Ad clicks":"Pages read",value:format(ads?report.clicks:report.pages.length),icon:ads?MousePointer2:FileText,change:ads?report.comparison.clicks:report.comparison.pages,note:ads?"Recorded ad interactions":"Distinct pages with activity"},
        {label:ads?"Click-through rate":"Approx. unique browsers",value:ads?`${report.ctr.toFixed(1)}%`:report.visitors===null?"Collecting":format(report.visitors),icon:Users,note:ads?"Clicks divided by impressions":report.visitorData.startedAt?`Tracking started ${report.visitorData.startedAt}`:"Counts begin with the first measured browser visit"},
        {label:ads?"Campaigns measured":"Engagement",value:ads?format(report.campaigns.length):format(report.engagement.likes+report.engagement.comments),icon:Activity,note:ads?"Campaigns with recorded activity":`${report.engagement.likes} likes · ${report.engagement.comments} comments`}
    ] : []
    return <div className={styles.dashboard}>
        <header className={styles.header}><div><div className={styles.eyebrow}><span/>TECH HUB INSIGHTS</div><h1>{ads?"Advertising performance":"Audience overview"}</h1><p>A clearer view of the stories people read and how they find you.</p></div><div className={styles.headerActions}><span className={styles.anonymous}><span/>First-party analytics</span><button className={styles.iconButton} aria-label="Refresh analytics" disabled={loading} onClick={()=>setRefresh(v=>v+1)}><RefreshCw size={17} className={loading?styles.spin:""}/></button></div></header>
        <div className={styles.filterBar}><label className={styles.period}><CalendarDays size={17}/><select aria-label="Reporting period" value={preset} onChange={e=>{const value=e.target.value as DatePreset;setPreset(value);if(value!=="custom"){const next=presetRange(value);setRange(next);setCustom(next)}}}>{presets.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><span className={styles.rangeLabel}>{dateLabel(range.start)} to {dateLabel(range.end)}, {range.end.slice(0,4)}</span><label className={styles.compare}><input type="checkbox" checked={compare} onChange={e=>setCompare(e.target.checked)}/>Compare previous period</label><span className={styles.utc}>Daily totals · UTC</span></div>
        {preset==="custom" && <form className={styles.customDates} onSubmit={e=>{e.preventDefault();const data=new FormData(e.currentTarget);const next={start:String(data.get("start")),end:String(data.get("end"))};setCustom(next);setRange(next)}}><label>From<input aria-label="Custom start date" name="start" type="date" required value={custom.start} onChange={e=>setCustom({...custom,start:e.target.value})}/></label><label>Through<input aria-label="Custom end date" name="end" type="date" required min={custom.start} value={custom.end} onChange={e=>setCustom({...custom,end:e.target.value})}/></label><button className={styles.primary} type="submit">Apply range</button><p>Choose up to two years.</p></form>}
        {error && <div role="alert" className={styles.error}><Info size={20}/><div><strong>Analytics could not be loaded</strong><p>{error}</p><button onClick={()=>setRefresh(v=>v+1)}>Try again</button></div></div>}
        {loading && <div role="status" className={styles.loading}><RefreshCw size={22} className={styles.spin}/><span>Loading measured activity for this period…</span><div className={styles.skeletons}>{[1,2,3,4].map(n=><div key={n}/>)}</div></div>}
        {report && !loading && <>
            <div className={styles.cards}>{metric.map(m=><section key={m.label} className={`${styles.card} ${m.featured?styles.featured:""}`}><div className={styles.cardLabel}><span>{m.label}</span><m.icon size={18}/></div><strong className={m.value==="Not measured"?styles.unavailable:styles.cardNumber}>{m.value}</strong><p>{m.note}</p>{compare&&m.change&&<Delta change={m.change}/>}</section>)}</div>
            <Panel title={ads?"Campaign activity":"Traffic over time"} note={`${range.start} to ${range.end}${compare?` · Compared with ${report.comparison.start} to ${report.comparison.end}`:""}`} action={<div className={styles.segmented}>{["line","bar"].map(mode=><button key={mode} aria-pressed={chartMode===mode} onClick={()=>setChartMode(mode)}>{mode==="line"?"Line":"Bars"}</button>)}</div>}>
                <div className={styles.chartSummary}><strong>{format(report.total)} <small>{ads?"ad events":"page views"}</small></strong><div className={styles.legend}><span><i/>Selected period</span>{compare&&<span><i className={styles.previousDot}/>Previous period</span>}</div></div>
                <TrafficChart key={query} daily={report.daily} previous={report.previousDaily} compare={compare} mode={chartMode} unit={ads?"ad events":"views"}/>
            </Panel>
            {!ads && <Panel title="Reader interactions over time" note="Recorded likes and visible comments, including guest readers"><TrafficChart daily={report.engagementDaily} previous={report.previousEngagementDaily} compare={compare} mode="bar" unit="interactions" /></Panel>}
            <div className={styles.insightGrid}>
                <Panel title="Where readers are" note={`${countryRows.filter(r=>r.name!=="Unknown").length} countries · ${countryUnit}`} action={<Globe2 size={19} className={styles.muted}/>}>
                    <div className="flex flex-wrap gap-3 px-6 pb-4 text-sm"><label>Measure <select aria-label="Country measurement" className="rounded border bg-background p-1" value={uniqueCountries?"visitors":"views"} onChange={e=>{setCountryMetric(e.target.value);setGeography("countries")}}><option value="views">Page views</option><option value="visitors">Approx. unique browsers</option></select></label><label>Rank by <select aria-label="Country ranking" className="rounded border bg-background p-1" value={countryOrder} onChange={e=>setCountryOrder(e.target.value)}><option value="count">Highest count</option><option value="name">Country name</option></select></label></div><CountryMap key={countryUnit+query} rows={countryRows} unit={countryUnit} /><div className={styles.tabs}>{["countries","regions"].map(g=><button key={g} aria-pressed={geography===g} onClick={()=>setGeography(g)}>{g==="countries"?"Countries":"Regions"}</button>)}</div><Bars rows={geography==="countries"?countryRows:report.regions} total={geography==="countries"&&uniqueCountries?report.visitors||0:report.total} countries={geography==="countries"}/><p className={styles.panelFoot}>Approximate network locations. Country totals can overlap when one browser visits from more than one country. Region figures count page views.</p>
                </Panel>
                <Panel title="Traffic sources" note="Referring websites bringing readers to Tech Hub"><Bars rows={report.referrers} total={report.total} color="blue"/><p className={styles.panelFoot}>Direct includes visits without a referring website. Internal links can appear as Tech Hub.</p></Panel>
            </div>
            <Panel title={ads?"Pages with ad activity":"Top content"} note={ads?"Ranked by recorded ad activity in the selected period":"Ranked by recorded page views in the selected period"} action={<label className={styles.search}><span className="sr-only">Search content</span><input aria-label="Search content" placeholder="Find an article or page…" value={search} onChange={e=>setSearch(e.target.value)}/></label>}>
                {filtered.length ? <div className={styles.tableScroll}><table className={styles.contentTable}><thead><tr><th>Article / page</th><th>Views</th>{compare&&<th>Change</th>}<th>Engagement</th></tr></thead><tbody>{filtered.slice(0,20).map((r,i)=><tr key={r.name}><td><div className={styles.contentCell}><span className={styles.rank}>{i+1}</span><div><a href={r.name.startsWith("/")&&!r.name.startsWith("//")?r.name:"#"} target="_blank" rel="noopener noreferrer">{r.title}<ChevronRight size={14}/></a><small>{r.section.replaceAll("-"," ")} · {r.name}</small></div></div></td><td><strong>{format(r.count)}</strong><div className={styles.miniBar}><span style={{width:`${report.total?r.count/report.total*100:0}%`}}/></div></td>{compare&&<td><Delta change={{current:r.count,previous:r.previous,percent:r.percent}}/></td>}<td><span>{r.likes} likes · {r.comments} comments</span></td></tr>)}</tbody></table></div>:<Empty>{search?"No content matches your search.":"Article and page rankings appear after recorded visits."}</Empty>}
            </Panel>
            <div className={styles.insightGrid}>
                <Panel title="Devices & browsers" note="How readers access your content">
                    {report.total ? <><div className={styles.deviceChart}><div className={styles.donut} style={{background:`conic-gradient(${(report.devices.reduce<{offset:number;stops:string[]}>((a,r,i)=>{const end=a.offset+r.count/report.total*100;a.stops.push(`${["var(--analytics-red)","#5385bf","#8f79ac","#9ca3af"][i%4]} ${a.offset}% ${end}%`);a.offset=end;return a},{offset:0,stops:[]})).stops.join(",")})`}}><div><strong>{format(report.total)}</strong><small>{ads?"ad events":"page views"}</small></div></div><div className={styles.deviceLegend}>{report.devices.map((d,i)=><div key={d.name}><i style={{background:["var(--analytics-red)","#5385bf","#8f79ac","#9ca3af"][i%4]}}/><span>{d.name}</span><strong>{Math.round(d.count/report.total*100)}%</strong></div>)}</div></div><div className={styles.browserList}>{report.browsers.map(b=><div key={b.name}><span>{b.name}</span><strong>{format(b.count)}</strong></div>)}</div></>:<Empty/>}
                </Panel>
                <Panel title="Audience & engagement" note="What the current measurement system can tell you"><div className={styles.availability}>{[["Browser estimates",report.visitors===null?"Collecting":format(report.visitors),`${report.visitorData.identifiedViews} of ${report.total} selected page views have a browser reference. Different devices, cleared storage and 30-day identifier expiry can increase the estimate.`],["Age & gender","Unavailable","Readers have not provided demographic information."],["Read time & scroll depth","Not collected","Reading duration and scroll depth are not measured."]].map(([label,status,reason])=><div key={label}><div><strong>{label}</strong><span>{status}</span></div><p>{reason}</p></div>)}</div>{report.subscriberGrowth!==null&&<p className={styles.subscriber}><Users size={16}/><span><strong>{format(report.subscriberGrowth)}</strong> subscribers joined during this period.</span></p>}</Panel>
            </div>
            {ads&&<Panel title="Campaign results" action={<a className={styles.primary} href={`/api/analytics?${query}&export=csv`}>Export CSV</a>}>{report.campaigns.length?<div className={styles.tableScroll}><table><thead><tr><th>Campaign</th><th>Impressions</th><th>Clicks</th></tr></thead><tbody>{report.campaigns.map(c=><tr key={c.name}><td>{c.name}</td><td>{format(c.impressions)}</td><td>{format(c.clicks)}</td></tr>)}</tbody></table></div>:<Empty>No ad activity recorded.</Empty>}</Panel>}
            {!ads && <details className="rounded-xl border p-5 text-sm"><summary className="cursor-pointer font-semibold">Historical measurement coverage</summary><div className="mt-3 space-y-2 text-muted-foreground"><p>{report.visitorData.audit.totalPageViews} stored page views retained, beginning {report.visitorData.audit.firstPageView || "with the first recorded visit"}. {report.visitorData.audit.unidentifiedViews} have no usable browser reference and cannot be converted into unique visitors.</p><p>{report.visitorData.audit.legacyIdentifiedViews} older consent-based views contain {report.visitorData.audit.legacyUniqueBrowsers} distinct browser references{report.visitorData.audit.legacyStart?` (${report.visitorData.audit.legacyStart} to ${report.visitorData.audit.legacyEnd})`:""}. These are a separate historical sample, not an all-time visitor total, and are not combined with the new identifiers.</p><p>{report.visitorData.startedAt?`New browser tracking first recorded on ${report.visitorData.startedAt}.`:"New browser tracking has not received its first identified visit yet."} Earlier page views remain included in traffic charts.</p></div></details>}
            <footer className={styles.footnote}><Info size={16}/><p>First-party measurements use a random browser reference lasting up to 30 days, without fingerprinting. Browser estimates are not a count of people. Page views include repeat visits and testing. Privacy preferences and blockers reduce coverage. “Location unavailable” includes older records without geography. Figures are not independently audited.</p><a href="/analytics-privacy" target="_blank" rel="noopener noreferrer">Measurement details <ChevronRight size={14}/></a></footer>
        </>}
    </div>
}
