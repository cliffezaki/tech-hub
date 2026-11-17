"use client"
import { useState } from "react"
function Logo({name,url}:{name:string;url:string}) {
 const [failed,setFailed]=useState(false)
 return <a href={url} target="_blank" rel="noopener noreferrer" title={name} aria-label={`${name} (opens in a new tab)`}>{failed?<span>{name.slice(0,2).toUpperCase()}</span>:<img src={`${new URL(url).origin}/favicon.ico`} width={24} height={24} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}</a>
}
export function SourceLogos({sources}:{sources:{name:string;url:string}[]}) {
 const publishers=sources.filter((s,i)=>sources.findIndex(p=>p.name===s.name)===i)
 return <div className="source-logos" aria-label="Reporting sources">{publishers.slice(0,4).map(s=><Logo key={s.name} {...s}/>)}{publishers.length>4&&<details className="source-overflow"><summary className="source-extra" title="More reporting sources">+{publishers.length-4}</summary><div>{publishers.slice(4).map(s=><a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer">{s.name} ↗</a>)}</div></details>}</div>
}
