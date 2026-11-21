"use client"
import { useEffect, useState } from "react"
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus } from "lucide-react"
import { MENU_NAMES, pinned, type MenuItem, type MenuLayout, type MenuName } from "@/lib/menu-layout"
export function NavigationManager() {
    const [layout,setLayout] = useState<MenuLayout | null>(null)
    const [editing,setEditing] = useState<Partial<MenuItem> | null>(null)
    const [busy,setBusy] = useState(false), [message,setMessage] = useState("")
    useEffect(() => { fetch("/api/navigation").then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); setLayout(d) }).catch(e => setMessage(e.message)) },[])
    async function change(data: Record<string,unknown>) {
        if (!layout) return
        setBusy(true); setMessage("")
        try {
            const r = await fetch("/api/navigation",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...data,revision:layout.revision})})
            const d = await r.json(); if (!r.ok) throw new Error(d.error)
            setLayout(d); setEditing(null); setMessage("Menu saved. The website now uses this order and visibility.")
        } catch(e) { setMessage((e as Error).message) } finally { setBusy(false) }
    }
    return <section className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-3xl font-bold">Navigation / menus</h1><p className="mt-2 max-w-3xl text-muted-foreground">These are the links currently used on your website—not an empty list of custom overrides. Move links, edit their labels, or hide them without deleting pages.</p></div><button className="cms-primary" onClick={() => setEditing({menu:"main",name:"",href:"",hidden:false})}><Plus size={16}/> Add link</button></div>
        <div className="rounded-xl border bg-muted/30 p-4 text-sm"><strong>Where links appear</strong><p className="mt-2">Header & hamburger controls the main navigation. Only Home and the five editorial sections appear in the centered desktop header; other links remain in the hamburger. Footer menus control Sections and More. Search and Log in / Sign up stay together at the end of More.</p><p className="mt-2">The Pages screen reorders page links across menus. This screen also lets you fine-tune each menu separately.</p></div>
        {message && <p role="status" className="rounded-lg border p-4 text-sm">{message}</p>}
        {editing && <form className="grid gap-4 rounded-xl border bg-background p-5 sm:grid-cols-2" onSubmit={e => {e.preventDefault(); void change({action:"saveLink",...editing})}}>
            <label>Link label<input className="cms-input" required maxLength={100} value={editing.name || ""} onChange={e => setEditing({...editing,name:e.target.value})}/></label>
            <label>Website path<input className="cms-input" required placeholder="/about" value={editing.href || ""} onChange={e => setEditing({...editing,href:e.target.value})}/></label>
            <label>Menu<select className="cms-input" value={editing.menu} onChange={e => setEditing({...editing,menu:e.target.value as MenuName})}>{Object.entries(MENU_NAMES).map(([value,name]) => <option value={value} key={value}>{name}</option>)}</select></label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={Boolean(editing.hidden)} onChange={e => setEditing({...editing,hidden:e.target.checked})}/> Hide this link (keep its page)</label>
            <div className="flex gap-4 sm:col-span-2"><button className="cms-primary" disabled={busy}>{busy ? "Saving…" : "Save link"}</button><button type="button" onClick={() => setEditing(null)}>Cancel</button></div>
        </form>}
        {!layout ? <div className="flex items-center gap-2 p-8"><Loader2 className="animate-spin"/> Loading menus…</div> : Object.entries(MENU_NAMES).map(([menu,name]) => {
            const items = layout.items.filter(i => i.menu === menu)
            const movable = items.filter(i => !pinned(i))
            return <section key={menu} className="overflow-hidden rounded-xl border bg-background"><div className="border-b bg-muted/40 p-4"><h2 className="font-semibold">{name}</h2><p className="text-xs text-muted-foreground">{items.length} links · order shown matches the website</p></div>
                {items.map(item => <div key={item.id} className="flex flex-wrap items-center gap-3 border-b p-4 last:border-0"><div className="min-w-0 flex-1"><p className="font-medium">{item.name} {item.hidden && <span className="ml-2 text-xs text-muted-foreground">Hidden</span>}</p><p className="text-xs text-muted-foreground">{item.href}</p></div>{pinned(item) ? <span className="text-xs text-muted-foreground">Fixed account links</span> : <div className="flex gap-2"><button className="rounded border p-2 disabled:opacity-30" aria-label={`Move ${item.name} up in ${name}`} disabled={busy || movable[0]?.id === item.id} onClick={() => change({action:"moveLink",id:item.id,direction:-1})}><ArrowUp size={16}/></button><button className="rounded border p-2 disabled:opacity-30" aria-label={`Move ${item.name} down in ${name}`} disabled={busy || movable.at(-1)?.id === item.id} onClick={() => change({action:"moveLink",id:item.id,direction:1})}><ArrowDown size={16}/></button><button className="rounded border p-2" aria-label={`Edit ${item.name} in ${name}`} onClick={() => setEditing(item)}><Pencil size={16}/></button></div>}</div>)}
            </section>
        })}
    </section>
}
