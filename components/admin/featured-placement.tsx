"use client"
import { PLACEMENTS, placementAllowed, placementLabel } from "@/lib/placements"
export function FeaturedPlacement({value,onChange,section,disabled=false}:{value:string[];onChange:(v:string[])=>void;section:string;disabled?:boolean}) {
 const options=PLACEMENTS.filter(p=>placementAllowed(p.id,section))
 return <div className="my-4 space-y-2"><label className="editor-setting">Featured Placement<select aria-label="Featured Placement" disabled={disabled} value="" onChange={e=>{const id=e.target.value;if(!id)return;onChange([...value.filter(v=>!(["homepage","homepage:also"].includes(id) && ["homepage","homepage:also"].includes(v))),id])}}><option value="">Choose a placement…</option>{[...new Set(options.map(p=>p.page))].map(page=><optgroup key={page} label={page}>{options.filter(p=>p.page===page && !value.includes(p.id)).map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</optgroup>)}</select></label><div className="flex flex-wrap gap-2" aria-label="Current featured placements">{value.map(id=><button disabled={disabled} type="button" key={id} className="rounded-full border bg-card px-2 py-1 text-xs" aria-label={`Remove ${placementLabel(id)}`} onClick={()=>onChange(value.filter(v=>v!==id))}>{placementLabel(id)} <span aria-hidden>×</span></button>)}</div><p className="text-xs text-muted-foreground">Select multiple destinations. Single-story replacements require confirmation when saved. No placements means automatic selection.</p></div>
}
export async function placementFetch(url:string,init:RequestInit) {
 let response=await fetch(url,init)
 if(response.status===409) {const data=await response.clone().json();if(data.confirmPlacements && confirm(data.error)) response=await fetch(url,{...init,body:JSON.stringify({...JSON.parse(String(init.body)),confirmPlacements:data.confirmPlacements})})}
 return response
}
