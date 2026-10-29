"use client"
import {useEffect,useState} from "react"
import Link from "next/link"
import type {visitorSummary} from "@/lib/analytics-report"
type Data={start:string;end:string;views:number;likes:number;comments:number;subscribers:number|null;visitors:number|null;articles:number;totalViews:number;totalSubscribers:number|null;previous:Record<string,number|null>;visitorData:ReturnType<typeof visitorSummary>}
export function OverviewStats(){
 const [data,setData]=useState<Data|null>(null),[error,setError]=useState(""),[allowed,setAllowed]=useState(true)
 useEffect(()=>{fetch("/api/overview",{cache:"no-store"}).then(async r=>{if(r.status===403){setAllowed(false);return}const d=await r.json();if(!r.ok)throw Error(d.error);setData(d)}).catch(e=>setError(e.message))},[])
 if(!allowed)return null
 if(error)return <p role="status">{error}</p>
 const cards:[keyof Data,string][]=[["views","Page views"],["likes","Article likes"],["comments","Visible comments"],["subscribers","New subscribers"]]
 if(data?.visitors!==null&&data?.visitors!==undefined)cards.splice(1,0,["visitors","Approx. unique browsers"])
 return <section aria-label="Performance summary" className="space-y-4"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Last 30 days{data?` · ${data.start} to ${data.end} (UTC)`:""}</p><Link href="/admin/analytics" className="rounded-lg border px-4 py-2 text-sm font-semibold hover:bg-muted">View Detailed Analytics →</Link></div><div className={`grid gap-3 sm:grid-cols-2 ${cards.length===5?"xl:grid-cols-5":"xl:grid-cols-4"}`}>{cards.map(([key,label])=>{const value=data?.[key];const before=data?.previous[key];return <section key={key} className="rounded-xl border bg-card p-4"><h2 className="text-sm text-muted-foreground">{label}</h2><p className="mt-2 text-2xl font-bold">{!data?"…":typeof value==="number"?value.toLocaleString():"Restricted"}</p>{typeof before==="number"&&<p className="mt-2 text-xs text-muted-foreground">{before>0&&typeof value==="number"?`${value>=before?"+":""}${Math.round((value-before)/before*100)}% vs previous 30 days`:"No previous baseline"}</p>}</section>})}</div>{data&&<div className="space-y-1 text-xs text-muted-foreground"><p>{data.visitorData.startedAt?`Browser-based visitor estimates started on ${data.visitorData.startedAt}. ${data.visitorData.identifiedViews} of ${data.views} selected page views have a browser reference.`:"Unique visitor estimates will appear after the first visit with the new tracking. Earlier page views are preserved."}</p><p>{data.totalViews.toLocaleString()} historical page views · {data.articles} articles published now{data.totalSubscribers!==null?` · ${data.totalSubscribers} current subscribers`:""}</p></div>}</section>
}
