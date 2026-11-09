"use client"
import { useEffect, useRef, useState } from "react"

/** Creates a new media asset; the original remains available in the library. */
export function ImageAdjuster({ src, onApply, onCancel }: { src: string; onApply: (url: string) => void; onCancel: () => void }) {
    const canvas = useRef<HTMLCanvasElement>(null)
    const [image, setImage] = useState<HTMLImageElement | null>(null)
    const [ratio, setRatio] = useState("original")
    const [width, setWidth] = useState(1200)
    const [height, setHeight] = useState(800)
    const [x, setX] = useState(50)
    const [y, setY] = useState(50)
    const [zoom, setZoom] = useState(1)
    const [busy, setBusy] = useState(false)
    const [error, setError] = useState("")
    useEffect(() => {
        let active = true
        const loaded = new window.Image()
        loaded.crossOrigin = "anonymous"
        loaded.onload = () => { if (active) { setImage(loaded); const w = Math.min(1920, loaded.naturalWidth); setWidth(w); setHeight(Math.round(w * loaded.naturalHeight / loaded.naturalWidth)) } }
        loaded.onerror = () => { if (active) setError("This image host does not allow editing. Upload the original file to the media library, then try again.") }
        loaded.src = src
        return () => { active = false }
    }, [src])
    useEffect(() => {
        if (!image || !canvas.current) return
        const ctx = canvas.current.getContext("2d")
        if (!ctx) return
        const target = width / height
        const cropW = Math.min(image.naturalWidth, image.naturalHeight * target) / zoom
        const cropH = cropW / target
        canvas.current.width = width
        canvas.current.height = height
        ctx.drawImage(image, (image.naturalWidth - cropW) * x / 100, (image.naturalHeight - cropH) * y / 100, cropW, cropH, 0, 0, width, height)
    }, [image, width, height, x, y, zoom])
    const aspect = ratio === "original" && image ? image.naturalWidth / image.naturalHeight : Number(ratio)
    function changeWidth(value: number) { const next = Math.max(32, Math.min(4096, value || 32)); setWidth(next); if (aspect) setHeight(Math.max(32, Math.min(4096, Math.round(next / aspect)))) }
    async function apply() {
        if (!canvas.current || !image) return
        setBusy(true); setError("")
        try {
            const blob = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob(b => b ? resolve(b) : reject(new Error("Could not process image.")), "image/webp", .9))
            if (blob.size > 4 * 1024 * 1024) throw new Error("Image exceeds 4MB. Reduce the output dimensions and try again.")
            const body = new FormData(); body.append("file", new File([blob], "edited-image.webp", { type: "image/webp" }))
            const response = await fetch("/api/media", { method: "POST", body })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Could not save image.")
            onApply(data.url)
        } catch (e) { setError(e instanceof Error ? e.message : "Could not save image.") } finally { setBusy(false) }
    }
    return <section className="my-3 space-y-3 rounded-lg border bg-background p-3" aria-label="Crop and resize image">
        <h3 className="font-semibold">Crop and resize</h3>
        <p className="text-xs text-muted-foreground">Preview your crop below. Applying saves a new copy and keeps the original in your library.</p>
        <canvas ref={canvas} aria-label="Image crop preview" className="mx-auto max-h-80 max-w-full border object-contain" />
        {!image && !error && <p role="status">Loading image…</p>}
        <label className="editor-setting">Aspect ratio<select value={ratio} disabled={busy} onChange={e => { const r = e.target.value; setRatio(r); const a = r === "original" && image ? image.naturalWidth / image.naturalHeight : Number(r); if (a) setHeight(Math.max(32, Math.min(4096, Math.round(width / a)))) }}><option value="original">Original</option><option value="1.7777777777777777">16:9 landscape</option><option value="1.3333333333333333">4:3 landscape</option><option value="1">1:1 square</option><option value="0.75">3:4 portrait</option><option value="0.5625">9:16 portrait</option><option value="0">Custom dimensions</option></select></label>
        <div className="grid grid-cols-2 gap-3"><label className="editor-setting">Width (px)<input type="number" min="32" max="4096" value={width} disabled={busy} onChange={e => changeWidth(Number(e.target.value))} /></label><label className="editor-setting">Height (px)<input type="number" min="32" max="4096" value={height} disabled={busy || ratio !== "0"} onChange={e => setHeight(Math.max(32, Math.min(4096, Number(e.target.value) || 32)))} /></label></div>
        <label className="editor-setting">Zoom<input type="range" min="1" max="4" step="0.05" value={zoom} disabled={busy} onChange={e => setZoom(Number(e.target.value))} /></label>
        <label className="editor-setting">Horizontal position<input type="range" min="0" max="100" value={x} disabled={busy} onChange={e => setX(Number(e.target.value))} /></label>
        <label className="editor-setting">Vertical position<input type="range" min="0" max="100" value={y} disabled={busy} onChange={e => setY(Number(e.target.value))} /></label>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2"><button type="button" className="editor-tool" disabled={busy || !image} onClick={() => void apply()}>{busy ? "Saving image…" : "Apply image changes"}</button><button type="button" className="editor-tool" disabled={busy} onClick={onCancel}>Cancel image changes</button></div>
    </section>
}
