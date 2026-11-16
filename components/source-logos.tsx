"use client"
import { useState } from "react"
function Logo({name,url}:{name:string;url:string}) {
 const [failed,setFailed]=useState(false)
 return <a href={url} target="_blank" rel="noopener noreferrer" title={name} aria-label={`${name} (opens in a new tab)`}>{failed?<span>{name.slice(0,2).toUpperCase()}</span>:<img src={`${new URL(url).origin}/favicon.ico`} width={24} height={24} alt="" loading="lazy" referrerPolicy="no-referrer" onError={()=>setFailed(true)}/>}</a>
}
export function SourceLogos({sources}:{sources:{name:string;url:string}[]}) {
 const publishers=sources.filter((s,i)=>sources.findIndex(p=>p.name===s.name)===i)
 return <div className="source-logos" aria-label="Reporting sources">{publishers.slice(0,4).map(s=><Logo key={s.name} {...s}/>)}{publishers.length>4&&<span className="source-extra" title={publishers.slice(4).map(s=>s.name).join(", ")}>+{publishers.length-4}</span>}</div>
}
