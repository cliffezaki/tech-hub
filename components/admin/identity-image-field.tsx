"use client"
/* eslint-disable @next/next/no-img-element */
import { useEffect, useId, useRef, useState } from "react"
import type { MediaItem } from "@/lib/types"
import type { IdentityKind } from "@/lib/identity-image"

export function IdentityImageField({ label, value, kind, onChange, onPending }: {
    label: string; value: string; kind: IdentityKind
    onChange: (url: string, icons?: Record<string, string>) => void
    onPending: (pending: boolean) => void
}) {
    const id = useId(), input = useRef<HTMLInputElement>(null)
    const [library, setLibrary] = useState<MediaItem[]>([]), [showLibrary, setShowLibrary] = useState(false)
    const [file, setFile] = useState<File | null>(null), [asset, setAsset] = useState<MediaItem | null>(null)
    const [preview, setPreview] = useState(""), [busy, setBusy] = useState(false), [error, setError] = useState("")
    const [crop, setCrop] = useState(false), [x, setX] = useState(50), [y, setY] = useState(50), [zoom, setZoom] = useState(1)
    const pending = Boolean(file || asset)
    useEffect(() => {
        if (!file || file.name.toLowerCase().endsWith(".svg")) return
        const url = URL.createObjectURL(file)
        setPreview(url)
        return () => URL.revokeObjectURL(url)
    }, [file])
    function select(nextFile: File | null, nextAsset: MediaItem | null) {
        setFile(nextFile); setAsset(nextAsset); setPreview(nextAsset?.url || "")
        setX(50); setY(50); setZoom(1); setCrop(false); setError(""); setShowLibrary(false)
        onPending(Boolean(nextFile || nextAsset))
    }
    async function loadLibrary() {
        setError("")
        try {
            const response = await fetch("/api/media")
            if (!response.ok) throw new Error("Could not load the media library.")
            const data = await response.json()
            setLibrary(data.filter((a: MediaItem) => /\.(png|jpe?g|webp|svg)$/i.test(a.url)))
            setShowLibrary(true)
        } catch { setError("Could not load the media library. Please try again.") }
    }
    async function prepare() {
        setBusy(true); setError("")
        try {
            const body = new FormData()
            if (file) body.set("file", file)
            if (asset) body.set("assetId", asset.id)
            body.set("kind", kind); body.set("crop", String(crop)); body.set("x", String(x)); body.set("y", String(y)); body.set("zoom", String(zoom))
            const response = await fetch("/api/settings/identity-image", { method: "POST", body })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Image preparation failed.")
            onChange(data.url, data.icons); select(null, null)
        } catch (e) { setError(e instanceof Error ? e.message : "Could not upload image.") }
        finally { setBusy(false) }
    }
    const ratio = kind === "icon" ? "1" : kind === "social" ? "1200 / 630" : "3"
    return <section className="space-y-3" aria-labelledby={`${id}-label`}>
        <h3 id={`${id}-label`} className="font-semibold">{label}</h3>
        <div className="flex min-h-28 items-center justify-center overflow-hidden rounded-lg border bg-muted/30 p-4">
            {value ? <img src={value} alt={`${label} selection`} className="max-h-32 max-w-full object-contain" /> : <p className="text-sm text-muted-foreground">{kind === "logo" ? "Using the original text logo" : kind === "icon" ? "Using the Tech Hub default icon" : "No default image selected"}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
            <button type="button" className="cms-secondary" disabled={busy} onClick={() => input.current?.click()}>{value ? "Change image" : "Upload image"}</button>
            <button type="button" className="cms-secondary" disabled={busy} onClick={loadLibrary}>Media library</button>
            {value && <button type="button" className="cms-secondary" disabled={busy || pending} onClick={() => onChange("")}>Remove</button>}
        </div>
        <input ref={input} type="file" className="sr-only" aria-label={`Upload ${label}`} accept=".png,.jpg,.jpeg,.webp,.svg" onChange={event => {
            const next = event.target.files?.[0]
            if (next && next.size <= 4 * 1024 * 1024) select(next, null)
            else if (next) setError("Choose an image no larger than 4 MB.")
            event.target.value = ""
        }} />
        {showLibrary && <div className="rounded-lg border p-3"><div className="mb-3 flex justify-between"><strong className="text-sm">Choose an image</strong><button type="button" onClick={() => setShowLibrary(false)}>Close library</button></div><div className="grid max-h-60 grid-cols-3 gap-3 overflow-auto">{library.map(item => <button type="button" key={item.id} title={item.filename} className="overflow-hidden rounded border p-2 text-left" onClick={() => select(null, item)}><img src={item.url} alt="" className="h-16 w-full object-contain" /><span className="block truncate text-xs">{item.filename}</span></button>)}</div>{!library.length && <p>No supported images yet.</p>}</div>}
        {pending && <div className="space-y-4 rounded-xl border p-4">
            <p className="text-sm font-medium">Prepare selected image — not saved to the website yet</p>
            {preview ? <div className="mx-auto max-w-sm overflow-hidden rounded border bg-muted" style={{ aspectRatio: ratio }}><img src={preview} alt="Crop preview" className="h-full w-full" style={{ objectFit: crop ? "cover" : "contain", objectPosition: `${x}% ${y}%`, transform: crop ? `scale(${zoom})` : undefined, transformOrigin: `${x}% ${y}%` }} /></div> : <p className="text-sm text-muted-foreground">SVG preview appears after security checks. Static SVGs are converted to PNG; unsupported active content is rejected.</p>}
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={crop} onChange={e => setCrop(e.target.checked)} />Crop to {kind === "icon" ? "square" : kind === "social" ? "social card" : "wide logo"} proportions</label>
            {crop && <div className="grid gap-3 sm:grid-cols-3">{[["Horizontal position", x, setX, 100, 1], ["Vertical position", y, setY, 100, 1], ["Zoom", zoom, setZoom, 3, 0.1]].map(([name, value, setter, max, step]) => <label className="text-xs" key={String(name)}>{String(name)}<input className="mt-2 block w-full" type="range" min={name === "Zoom" ? 1 : 0} max={Number(max)} step={Number(step)} value={Number(value)} onChange={e => (setter as (n: number) => void)(Number(e.target.value))} /></label>)}</div>}
            <div className="flex gap-2"><button type="button" className="cms-primary" disabled={busy} onClick={prepare}>{busy ? "Preparing…" : "Use this image"}</button><button type="button" className="cms-secondary" disabled={busy} onClick={() => select(null, null)}>Cancel</button></div>
        </div>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <p className="text-xs text-muted-foreground">PNG, JPG, WebP or static SVG • up to 4 MB. {kind === "icon" ? "Recommended: 512 × 512 px. Generates ICO, 16, 32, 180, 192 and 512 px PNG icons." : kind === "social" ? "Recommended: 1200 × 630 px." : "Recommended: 600 × 200 px, transparent background. Display height: up to 40 px."}</p>
    </section>
}
