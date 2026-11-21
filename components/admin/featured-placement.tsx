"use client"
import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { PLACEMENTS, placementAllowed } from "@/lib/placements"
export function FeaturedPlacement({value,onChange,section,disabled=false}:{value:string[];onChange:(v:string[])=>void;section:string;disabled?:boolean}) {
 const [open,setOpen]=useState<string|null>(null)
 const root=useRef<HTMLDivElement>(null)
 useEffect(()=>{function close(e:PointerEvent){if(!root.current?.contains(e.target as Node))setOpen(null)}document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close)},[])
 const groups=[{label:"Home",pages:["Homepage"]},{label:"News",pages:["News"]},{label:"More",pages:[...new Set(PLACEMENTS.map(p=>p.page))].filter(p=>!["Homepage","News"].includes(p))}]
 function toggle(id:string,checked:boolean){onChange(checked?[...value.filter(v=>v!==id&&!( ["homepage","homepage:also"].includes(id)&&["homepage","homepage:also"].includes(v))),id]:value.filter(v=>v!==id))}
 return <div ref={root} className="placement-toolbar" role="group" aria-label="Featured placement" onKeyDown={e=>{if(e.key==="Escape")setOpen(null)}}>{groups.map(g=>{const all=PLACEMENTS.filter(p=>g.pages.includes(p.page));const options=all.filter(p=>placementAllowed(p.id,section)||value.includes(p.id));const active=all.filter(p=>value.includes(p.id));return <div key={g.label} className="placement-group" data-active={active.length>0}>
 {g.label!=="More"&&<label><input type="checkbox" checked={active.length>0} disabled={disabled||!options.length} onChange={e=>{if(e.target.checked&&options[0])toggle(options[0].id,true);else onChange(value.filter(id=>!all.some(p=>p.id===id)))}}/>{g.label}</label>}
 <button type="button" disabled={disabled} aria-label={g.label==="More"?"More":`${g.label} destinations`} aria-expanded={open===g.label} title={active.map(p=>p.label).join(", ")||`${g.label} placements`} onClick={()=>setOpen(open===g.label?null:g.label)}>{g.label==="More"&&<>More{active.length>0&&<span className="placement-dot"/>}</>}<ChevronDown size={14} aria-hidden/></button>
 {open===g.label&&<div className="placement-menu">{g.pages.map(page=><fieldset key={page}><legend>{page}</legend>{all.filter(p=>p.page===page).map(p=><label key={p.id}><input type="checkbox" checked={value.includes(p.id)} disabled={disabled||(!placementAllowed(p.id,section)&&!value.includes(p.id))} onChange={e=>toggle(p.id,e.target.checked)}/>{p.label}</label>)}</fieldset>)}</div>}
 </div>})}</div>
}
export async function placementFetch(url:string,init:RequestInit) {
 let response=await fetch(url,init)
 if(response.status===409) {const data=await response.clone().json();if(data.confirmPlacements && confirm(data.error)) response=await fetch(url,{...init,body:JSON.stringify({...JSON.parse(String(init.body)),confirmPlacements:data.confirmPlacements})})}
 return response
}
