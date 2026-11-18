"use client"
import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Monitor, Sun, Moon } from "lucide-react"
const subscribe = () => () => {}
const modes = [{id:"system",label:"System",Icon:Monitor},{id:"light",label:"Light",Icon:Sun},{id:"midnight",label:"Midnight",Icon:Moon}]
export function ThemeToggle() {
 const mounted=useSyncExternalStore(subscribe,()=>true,()=>false)
 const {theme,setTheme,forcedTheme}=useTheme()
 const selected=mounted ? theme === "dark" ? "midnight" : theme || "system" : "system"
 const index = Math.max(0, modes.findIndex(mode => mode.id === selected))
 const current = modes[index]
 const next = modes[(index + 1) % modes.length]
 return <><button type="button" className="mobile-mode" disabled={!mounted || !!forcedTheme} aria-label={`Appearance ${current.label}. Switch to ${next.label}`} onClick={() => setTheme(next.id)}><current.Icon size={19} /></button><div className="appearance-control" role="group" aria-label="Appearance"><span aria-hidden className="appearance-active" style={{transform:`translateX(${Math.max(0,modes.findIndex(m=>m.id===selected))*100}%)`}}/>{modes.map(({id,label,Icon})=><button key={id} type="button" title={label} aria-label={label} aria-pressed={selected===id} disabled={!mounted||!!forcedTheme} onClick={()=>setTheme(id)}><Icon size={17} aria-hidden="true"/></button>)}</div></>
}
