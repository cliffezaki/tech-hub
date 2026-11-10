"use client"
import { useEffect, useRef, useState } from "react"
import { ChevronDown } from "lucide-react"
import { FONT_GROUPS } from "@/lib/editor-fonts"
export function FontPicker({ value, onChange }: { value: string; onChange: (font: string) => void }) {
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState("")
    const root = useRef<HTMLDivElement>(null)
    const trigger = useRef<HTMLButtonElement>(null)
    useEffect(() => {
        if (!open) return
        const close = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
        document.addEventListener("pointerdown", close)
        return () => document.removeEventListener("pointerdown", close)
    }, [open])
    function choose(font: string) { setOpen(false); setSearch(""); onChange(font) }
    return <div className="editor-font-picker" ref={root} onKeyDown={e => { if (e.key === "Escape") { setOpen(false); trigger.current?.focus() } }}>
        <button ref={trigger} type="button" className="editor-tool editor-font-trigger" aria-label="Font family" aria-expanded={open} aria-haspopup="dialog" title="Font family" onMouseDown={e => e.preventDefault()} onClick={() => { setSearch(""); setOpen(!open) }}><span>{value || "Site default (Inter)"}</span><ChevronDown size={14} /></button>
        {open && <div className="editor-font-menu" role="dialog" aria-label="Choose font">
            <input autoFocus type="search" aria-label="Search fonts" placeholder="Search fonts…" value={search} onChange={e => setSearch(e.target.value)} />
            <div className="editor-font-options">
                {!search && <button type="button" aria-pressed={!value} onClick={() => choose("")}>Site default (Inter)</button>}
                {Object.entries(FONT_GROUPS).map(([group, fonts]) => { const matches = fonts.filter(font => font.toLowerCase().includes(search.toLowerCase())); return matches.length ? <div key={group}><p>{group}</p>{matches.map(font => <button type="button" key={font} style={{ fontFamily: font }} aria-pressed={value === font} onClick={() => choose(font)}>{font}</button>)}</div> : null })}
                {!Object.values(FONT_GROUPS).flat().some(font => font.toLowerCase().includes(search.toLowerCase())) && <p>No matching fonts</p>}
            </div>
        </div>}
    </div>
}
