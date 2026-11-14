"use client"
import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
const subscribe = () => () => {}
export function ThemeToggle() {
 const mounted=useSyncExternalStore(subscribe,()=>true,()=>false)
 const {theme,resolvedTheme,setTheme,forcedTheme}=useTheme()
 return <select aria-label="Appearance" title="Appearance" className="appearance-select" value={mounted ? theme === "system" ? resolvedTheme || "system" : theme : "system"} disabled={!mounted || !!forcedTheme} onChange={e=>setTheme(e.target.value)}><option value="system" hidden>Appearance</option><option value="light">Light</option><option value="dark">Dark</option><option value="midnight">Midnight</option></select>
}
