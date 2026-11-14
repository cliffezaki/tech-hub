"use client"
import {useEffect,useState} from "react"
type Country={code:string;name:string;path:string}
export function CountryMap({rows,unit="page views"}:{rows:{name:string;count:number}[];unit?:string}){
 const [countries,setCountries]=useState<Country[]>([]),[selected,setSelected]=useState("")
 useEffect(()=>{fetch("/maps/countries.json").then(r=>r.json()).then(setCountries).catch(()=>{})},[])
 const counts=new Map(rows.map(r=>[r.name,r.count])),max=Math.max(1,...rows.map(r=>r.count))
 return <div className="px-6 pb-4"><svg viewBox="0 0 720 360" className="w-full" aria-label={`Recorded ${unit} by country`}><rect width="720" height="360" fill="transparent"/>{countries.map(c=>{const count=counts.get(c.code)||0;return <path key={c.code+c.name} d={c.path} aria-hidden={!count} fill={count?`rgba(200,32,45,${.3+.7*count/max})`:"#94a3b833"} stroke="currentColor" strokeOpacity=".25" strokeWidth=".35" tabIndex={count?0:undefined} role={count?"button":undefined} aria-label={`${c.name}: ${count} ${unit}`} onMouseEnter={()=>setSelected(`${c.name}: ${count} ${unit}`)} onFocus={()=>setSelected(`${c.name}: ${count} ${unit}`)} onClick={()=>setSelected(`${c.name}: ${count} ${unit}`)} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();setSelected(`${c.name}: ${count} ${unit}`)}}}><title>{c.name}: {count} {unit}</title></path>})}</svg><p role="status" className="text-sm">{selected||(rows.some(r=>/^[A-Z]{2}$/.test(r.name)&&r.count>0)?"Select a highlighted country to see recorded totals.":"Country locations are unavailable for this period.")}</p><p className="mt-2 text-xs text-muted-foreground">Map: Natural Earth via DataHub geo-countries. Displayed measure: {unit}.</p></div>
}
