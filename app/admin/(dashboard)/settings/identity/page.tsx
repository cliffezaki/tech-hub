"use client"
/* eslint-disable @next/next/no-img-element */
import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { IdentityImageField } from "@/components/admin/identity-image-field"
import { ICON_FIELDS, IDENTITY_IMAGES } from "@/lib/site-identity"
import type { SiteSettings } from "@/lib/types"

const fields = ["siteName", "tagline", "logoLight", "logoDark", "logoSame", "logoWidth", ...ICON_FIELDS, "socialImage", "socialTitle", "socialDescription"] as const
export default function SiteIdentityPage() {
    const router = useRouter()
    const [settings, setSettings] = useState<SiteSettings | null>(null), [saved, setSaved] = useState<SiteSettings | null>(null)
    const [error, setError] = useState(""), [message, setMessage] = useState(""), [busy, setBusy] = useState(false), [pending, setPending] = useState<Record<string, boolean>>({})
    const dirty = Boolean(settings && saved && fields.some(key => settings[key] !== saved[key]))
    const preparing = Object.values(pending).some(Boolean)
    useEffect(() => {
        fetch("/api/settings", { cache: "no-store" }).then(async r => { if (!r.ok) throw new Error(); return r.json() }).then(data => { setSettings(data); setSaved(data) }).catch(() => setError("Could not load Site Identity. Refresh to try again."))
    }, [])
    useEffect(() => {
        if (!dirty && !preparing) return
        const guard = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = "" }
        window.addEventListener("beforeunload", guard)
        return () => window.removeEventListener("beforeunload", guard)
    }, [dirty, preparing])
    function update(patch: Partial<SiteSettings>) { setSettings(s => s ? { ...s, ...patch } : s); setMessage("") }
    async function save() {
        if (!settings) return
        setBusy(true); setError(""); setMessage("")
        try {
            const response = await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.fromEntries(fields.filter(key => settings[key] !== saved?.[key]).map(key => [key, settings[key]]))) })
            const data = await response.json()
            if (!response.ok) throw new Error(data.error || "Could not save identity.")
            setSettings(data); setSaved(data); setMessage("Site Identity saved. The public website will use these settings on its next page load. Browser and social-platform caches may take longer to refresh."); router.refresh()
        } catch (e) { setError(e instanceof Error ? e.message : "Could not save identity.") }
        finally { setBusy(false) }
    }
    if (!settings) return <p role={error ? "alert" : "status"}>{error || "Loading Site Identity…"}</p>
    function textField(key: "siteName" | "tagline" | "socialTitle" | "socialDescription", label: string, limit: number) {
        return <label className="block space-y-2 text-sm font-medium">{label}<input className="cms-input w-full" maxLength={limit} value={settings![key]} onChange={e => update({ [key]: e.target.value })} /></label>
    }
    function image(key: typeof IDENTITY_IMAGES[number], label: string, kind: "logo" | "icon" | "social") {
        return <IdentityImageField value={settings![key]} label={label} kind={kind} onPending={value => setPending(p => ({ ...p, [key]: value }))} onChange={(url, icons) => {
            if (kind === "icon") update(icons || Object.fromEntries(ICON_FIELDS.map(k => [k, ""])))
            else update({ [key]: url })
        }} />
    }
    return <div className="identity-settings mx-auto max-w-5xl space-y-6 pb-10">
        <Link href="/admin/settings" className="text-sm underline" onClick={e => { if ((dirty || preparing) && !window.confirm("Leave without saving Site Identity changes?")) e.preventDefault() }}>← Settings</Link>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="kicker text-brand-red">Brand & publication</p><h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-bold">Site Identity</h1><p className="mt-2 max-w-xl text-sm text-muted-foreground">Manage your publication’s branding. Preparing images adds them to the media library; only Save Changes updates the website.</p></div><button className="cms-primary" disabled={busy || !dirty || preparing} onClick={save}>{busy ? "Saving…" : "Save Changes"}</button></div>
        {error && <p role="alert" className="rounded border border-destructive p-3 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded border p-3 text-sm">{message}</p>}
        <fieldset disabled={busy} className="space-y-6">
            <section className="space-y-4 rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">Site Name & Tagline</h2>{textField("siteName", "Site name", 80)}{textField("tagline", "Tagline / description", 300)}</section>
            <section className="space-y-5 rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">Website Logo</h2><p className="text-sm text-muted-foreground">The original TECH HUB text logo remains the fallback. Remove a custom logo to restore it.</p><label className="block text-sm">Display width: {settings.logoWidth} px<input className="mt-2 block w-full max-w-xs" type="range" min="80" max="180" value={settings.logoWidth} onChange={e => update({ logoWidth: e.target.value })} /></label>
                <h3 className="font-semibold">Light & Dark Mode Logos</h3><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.logoSame !== "false"} disabled={preparing} onChange={e => update({ logoSame: String(e.target.checked) })} />Use the same logo for both themes</label>
                <div className="grid gap-6 md:grid-cols-2">{image("logoLight", "Light mode / primary logo", "logo")}{settings.logoSame === "false" && image("logoDark", "Dark mode logo", "logo")}</div>
                <div className="grid gap-3 sm:grid-cols-2">{[false, true].map(dark => { const url = dark && settings.logoSame === "false" ? settings.logoDark || settings.logoLight : settings.logoLight; return <div key={String(dark)} className="rounded-lg border p-4" style={{ background: dark ? "#1C1D21" : "#FAF8F3", color: dark ? "#F3F1EC" : "#171717" }}><p className="mb-4 text-xs">{dark ? "Charcoal" : "Ivory"} preview</p>{url ? <img src={url} alt={`${dark ? "Dark" : "Light"} logo preview`} style={{ width: Number(settings.logoWidth), height: 40, objectFit: "contain", objectPosition: "left" }} /> : <span className="font-black uppercase">{settings.siteName}</span>}</div> })}</div>
            </section>
            <section className="space-y-5 rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">Site Icon (Favicon)</h2>{image("iconSource", "Site icon", "icon")}<div className="max-w-sm rounded-t-lg border bg-muted p-3"><div className="flex items-center gap-2 rounded bg-card px-3 py-2 text-sm"><img src={settings.icon32 || "/site-icon.svg"} width="16" height="16" alt="Browser tab icon preview" /><span className="truncate">{settings.siteName} — {settings.tagline}</span><span aria-hidden="true" className="ml-auto">×</span></div></div></section>
            <section className="space-y-5 rounded-xl border bg-card p-5"><h2 className="text-lg font-semibold">Social Sharing Image</h2><p className="text-sm text-muted-foreground">Used as the default. Articles retain their own headlines, descriptions and featured images.</p>{image("socialImage", "Default social image", "social")}{textField("socialTitle", "Social sharing title (optional)", 150)}{textField("socialDescription", "Social sharing description (optional)", 500)}<div className="max-w-lg overflow-hidden rounded-lg border">{settings.socialImage && <img src={settings.socialImage} alt="Social card preview" className="aspect-[1200/630] w-full object-cover" />}<div className="space-y-1 p-4"><p className="text-xs uppercase text-muted-foreground">Link preview</p><strong>{settings.socialTitle || settings.siteName}</strong><p className="text-sm text-muted-foreground">{settings.socialDescription || settings.tagline}</p></div></div></section>
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-5"><p className="text-sm text-muted-foreground">{preparing ? "Finish or cancel your image preparation before saving." : dirty ? "You have unsaved identity changes." : "No unsaved changes."}</p><button className="cms-primary" disabled={busy || !dirty || preparing} onClick={save}>{busy ? "Saving…" : "Save Changes"}</button></div>
    </div>
}
