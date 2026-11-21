"use client"
import { useState } from "react"
function Logo({name,url}:{name:string;url:string}) {
 const [failed,setFailed]=useState(false)
 return <a href={url} target="_blank" rel="noopener noreferrer" title={name} aria-label={`${name} (opens in a new tab)`}>{failed?<span>{name.slice(0,2).toUpperCase()}</span>:<img src={`${new URL(url).origin}/favicon.ico`} width={24} height={24} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}</a>
}
export function SourceLogos({sources}:{sources:{name:string;url:string}[]}) {
 const publishers=sources.filter((s,i)=>sources.findIndex(p=>p.name===s.name)===i)
 const visible=publishers.slice(0,4)
 const remaining=sources.filter((source,index)=>sources.findIndex(s=>s.url===source.url)===index&&!visible.some(s=>s.url===source.url))
 return <div className="source-logos" aria-label="Reporting sources">{visible.map(s=><Logo key={s.name} {...s}/>)}{remaining.length>0&&<details className="source-overflow"><summary className="source-extra" title="More reporting sources">+{remaining.length}</summary><div>{remaining.map(s=><a key={s.url} href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a>)}</div></details>}</div>
}
