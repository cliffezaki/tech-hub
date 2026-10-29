"use client"
import {useEffect,useState} from "react"
export function OverviewStats(){
 const [data,setData]=useState<Record<string,number|null>|null>(null),[error,setError]=useState("")
 useEffect(()=>{fetch("/api/overview",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok)throw Error(d.error);setData(d)}).catch(e=>setError(e.message))},[])
 if(error)return <p role="status">{error}</p>
 return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["visitors","Total / unique visitors"],["views","Page views"],["articles","Published articles"],["comments","Visible comments"],["subscribers","Subscribers"],["likes","Article likes"]].map(([key,label])=><section key={key} className="rounded-xl border bg-card p-5"><h2 className="text-sm text-muted-foreground">{label}</h2><p className="mt-2 text-2xl font-bold">{!data?"Loading…":data[key]===null?"Unavailable":data[key]?.toLocaleString()}</p>{key==="visitors"&&<p className="mt-2 text-xs text-muted-foreground">Current tracking counts views without identifying people.</p>}</section>)}</div>
}
