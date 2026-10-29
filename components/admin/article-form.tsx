"use client"
/* eslint-disable @next/next/no-img-element, @next/next/no-html-link-for-pages */
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { VisualEditor } from "@/components/admin/visual-editor"
import { ImageField } from "@/components/admin/image-field"
import { Markdown } from "@/components/markdown"
import { ARTICLE_SECTIONS, SECTION_META, type Article, type ArticleSection } from "@/lib/types"
import { documentText } from "@/lib/rich-content"
import { editorDocument } from "@/lib/legacy-document"
import type { Permission } from "@/lib/permissions"

function slugify(s: string) { return s.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "") }
function localDate(s: string) { const d = new Date(s); return Number.isNaN(d.getTime()) ? "" : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16) }
function fields(a?: Partial<Article>, defaults?: { author: string; category: string }) { return { title: a?.title || "", slug: a?.slug || "", excerpt: a?.excerpt || "", content: a?.content || "", category: a?.category || defaults?.category || "News", section: (a?.section || "news") as ArticleSection, author: a?.author || defaults?.author || "Tech Hub Staff", publishedAt: localDate(a?.publishedAt || new Date().toISOString()), readTime: a?.readTime || "", imageUrl: a?.imageUrl || "", imageAlt: a?.imageAlt || "", imageCredit: a?.imageCredit || "", featured: a?.featured || false, seoTitle: a?.seoTitle || "", metaDescription: a?.metaDescription || "", tags: a?.tags || [] } }
type Form = ReturnType<typeof fields>
type Saved = { savedAt: string; data: Partial<Article>; id: string }
export function ArticleForm({ initialData, defaults, permissions = [] }: { initialData?: Article; defaults?: { author: string; category: string }; isEditing?: boolean; permissions?: Permission[] }) {
    const [form, setForm] = useState(() => fields(initialData, defaults))
    const [id, setId] = useState(initialData?.id || "")
    const [workspaceId, setWorkspaceId] = useState(initialData?.id || "")
    const [status, setStatus] = useState<string>(initialData?.scheduledAt ? "scheduled" : initialData?.status || "draft")
    const [sidebar, setSidebar] = useState(true)
    const [preview, setPreview] = useState<"" | "desktop" | "mobile">("")
    useEffect(() => {
        if (!preview) return
        const previous = document.body.style.overflow
        document.body.style.overflow = "hidden"
        const close = (event: KeyboardEvent) => { if (event.key === "Escape") setPreview("") }
        window.addEventListener("keydown", close)
        return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", close) }
    }, [preview])
    const [slugTouched, setSlugTouched] = useState(!!initialData)
    const [notice, setNotice] = useState("")
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(JSON.stringify(fields(initialData, defaults)))
    const [loaded, setLoaded] = useState(false)
    const [revisions, setRevisions] = useState<Saved[]>([])
    const [recovery, setRecovery] = useState<Saved | null>(null)
    const [showHistory, setShowHistory] = useState(false)
    const [editorKey, setEditorKey] = useState(0)
    const requestBusy = useRef(false)
    const manualBusy = useRef(false)
    const latest = useRef(form); latest.current = form
    const dirty = JSON.stringify(form) !== saved
    const canPublish = permissions.includes("articles.publish")
    let conversionError = ""
    try { editorDocument(form.content) } catch (e) { conversionError = (e as Error).message }
    const update = <K extends keyof Form>(key: K, value: Form[K]) => setForm(f => ({ ...f, [key]: value }))
    const payload = (f: Form) => ({ ...f, slug: f.slug || slugify(f.title), publishedAt: f.publishedAt ? new Date(f.publishedAt).toISOString() : new Date().toISOString() })
    useEffect(() => {
        let active = true
        const draftKey = "techhub-new-article-draft"
        const draftId = initialData?.id || sessionStorage.getItem(draftKey) || `new-${crypto.randomUUID()}`
        if (!initialData) sessionStorage.setItem(draftKey, draftId)
        setWorkspaceId(draftId)
        fetch(`/api/articles/${draftId}/workspace`).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); if (active) { setRevisions(d.revisions || []); if (d.workspace && (!initialData?.updatedAt || d.workspace.savedAt > initialData.updatedAt)) setRecovery(d.workspace) } }).catch(() => { if (active) setNotice("Draft recovery is temporarily unavailable. Manual saving is still available.") }).finally(() => { if (active) setLoaded(true) })
        return () => { active = false }
    }, [initialData])
    useEffect(() => { const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = "" } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn) }, [dirty])
    useEffect(() => {
        const guard = (event: MouseEvent) => {
            const link = (event.target as Element)?.closest?.("a")
            if (!dirty || !link || link.target === "_blank" || link.getAttribute("href")?.startsWith("#") || link.closest(".article-topbar")) return
            if (!confirm("Leave without saving your latest changes?")) { event.preventDefault(); event.stopPropagation() }
        }
        document.addEventListener("click", guard, true)
        return () => document.removeEventListener("click", guard, true)
    }, [dirty])
    async function saveWorkspace(checkpoint = false) {
        if (requestBusy.current || !workspaceId || conversionError) return
        requestBusy.current = true
        const snapshot = latest.current
        try { const r = await fetch(`/api/articles/${workspaceId}/workspace`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload(snapshot), checkpoint }) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Draft could not be saved"); setSaved(JSON.stringify(snapshot)); setNotice(`${checkpoint ? "Draft saved" : "Autosaved"} at ${new Date(d.savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}${status === "published" ? " · live article unchanged" : ""}`); setError("") } catch (e) { setError((e as Error).message) } finally { requestBusy.current = false }
    }
    useEffect(() => { if (!loaded || !dirty || saving || recovery || conversionError) return; const timer = setTimeout(() => { void saveWorkspace() }, 2500); return () => clearTimeout(timer) })
    async function saveArticle(publish: boolean, schedule = false) {
        if (manualBusy.current || saving) return
        if (conversionError) { setError(conversionError); return }
        if (!form.title.trim()) { setError("Add a headline first."); return }
        if (schedule && (!form.publishedAt || new Date(form.publishedAt).getTime() <= Date.now())) { setError("Choose a future publication date in Article settings before scheduling."); setSidebar(true); return }
        manualBusy.current = true; setSaving(true); setError("")
        const snapshot = form
        let ownsRequest = false
        try {
            for (let i = 0; requestBusy.current && i < 100; i++) await new Promise(resolve => setTimeout(resolve, 100))
            if (requestBusy.current) throw new Error("Autosave is taking longer than expected. Please try again.")
            if (!publish && ["published", "scheduled"].includes(status)) { await saveWorkspace(true); return }
            requestBusy.current = true; ownsRequest = true
            const r = await fetch(id ? `/api/articles/${id}` : "/api/articles", { method: id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload(snapshot), scheduledAt: schedule ? new Date(snapshot.publishedAt).toISOString() : "", status: publish ? "published" : "draft" }) })
            const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not save article")
            setId(d.id); setWorkspaceId(d.id); setStatus(d.scheduledAt ? "scheduled" : d.status); setSaved(JSON.stringify(snapshot))
            setNotice(schedule ? "Scheduled. This story stays private until its publication date." : publish ? "Article published. Your changes are live." : "Draft saved. It is not public.")
            sessionStorage.removeItem("techhub-new-article-draft"); window.history.replaceState(null, "", `/admin/articles/${d.id}`)
        } catch (e) { setError((e as Error).message) } finally { setSaving(false); if (ownsRequest) requestBusy.current = false; manualBusy.current = false }
    }
    function restore(data: Partial<Article>) { setForm(fields(data, defaults)); setEditorKey(k => k + 1); setSlugTouched(true); setRecovery(null); setNotice("Version restored to your editor. Review it, then save or publish.") }
    async function restoreRevision(revision: string) {
        if (dirty && !confirm("Replace your current unsaved editor content with this version?")) return
        try { const r = await fetch(`/api/articles/${workspaceId}/workspace?revision=${encodeURIComponent(revision)}`); const d = await r.json(); if (!r.ok) throw new Error(d.error); restore(d.data) } catch { setError("That version could not be loaded. Your editor content has been kept.") }
    }
    async function cancelSchedule() {
        if (!id || !confirm("Cancel this article’s scheduled publication? It will remain a private draft.")) return
        setSaving(true)
        try { const r = await fetch(`/api/articles/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "draft", scheduledAt: "" }) }); if (!r.ok) throw new Error((await r.json()).error); setStatus("draft"); setNotice("Schedule cancelled. Article is a private draft.") } catch (e) { setError((e as Error).message) } finally { setSaving(false) }
    }
    async function history() { setShowHistory(v => !v); try { const r = await fetch(`/api/articles/${workspaceId}/workspace`); const d = await r.json(); if (!r.ok) throw new Error(d.error); setRevisions(d.revisions || []) } catch { setError("Revision history could not load.") } }
    const input = (key: Exclude<keyof Form, "featured" | "tags">, name: string, type = "text") => <label className="editor-setting">{name}<input type={type} value={form[key]} onChange={e => { if (key === "slug") setSlugTouched(true); update(key, e.target.value as never) }} /></label>
    return <div className="article-workspace">
        <header className="article-topbar"><div><a href="/admin/articles" onClick={e => { if (dirty && !confirm("Leave without saving your latest changes?")) e.preventDefault() }}>← All articles</a><p className="text-xs text-muted-foreground mt-1">{status === "published" ? "Published article" : "New story / draft"} · {notice || (dirty ? "Unsaved changes" : "Ready to write")}</p></div><div className="flex flex-wrap gap-2">
            <button className="editor-tool" type="button" onClick={() => void history()}>History</button><button className="editor-tool" type="button" onClick={() => setPreview("desktop")}>Preview</button><button className="editor-tool" type="button" disabled={saving || !!conversionError} onClick={() => void saveArticle(false)}>Save draft</button>{canPublish && <button className="editor-publish" type="button" disabled={saving || !!conversionError} onClick={() => void saveArticle(true)}>{saving ? "Saving…" : status === "published" ? "Update" : "Publish"}</button>}<button className="editor-tool" type="button" aria-expanded={sidebar} onClick={() => setSidebar(v => !v)}>Settings</button></div></header>
        {canPublish && <div className="px-4 py-2 flex gap-3 items-center text-sm"><button type="button" className="editor-tool" disabled={saving || !!conversionError} onClick={() => void saveArticle(true, true)}>Schedule</button><span>{status === "scheduled" ? "Scheduled story · " : ""}Uses the publication date in Settings. Times use your device’s time zone.</span></div>}
        {status === "scheduled" && permissions.includes("articles.unpublish") && <button className="editor-tool mx-4" disabled={saving} type="button" onClick={() => void cancelSchedule()}>Cancel scheduled publication</button>}
        {error && <p role="alert" className="m-4 rounded border border-red-400 p-3">{error}</p>}
        {recovery && <div className="m-4 rounded border border-amber-400 p-4">A saved working draft from {new Date(recovery.savedAt).toLocaleString()} is available. <button type="button" className="editor-tool" onClick={() => restore(recovery.data)}>Restore draft</button><button type="button" className="editor-tool" onClick={() => setRecovery(null)}>Keep current version</button></div>}
        {showHistory && <div className="m-4 rounded border p-4"><h2 className="font-bold">Revision history</h2><p className="text-sm">Restoring loads a version into the editor. Publishing still requires the Update or Publish button.</p>{revisions.length ? revisions.map(r => <div className="flex justify-between gap-3 border-b py-3" key={r.id}><span>{new Date(r.savedAt).toLocaleString()} · {r.data.title}</span><button type="button" className="editor-tool" onClick={() => void restoreRevision(r.id)}>Restore</button></div>) : <p className="py-3">Your saved versions will appear here.</p>}</div>}
        <div className={sidebar ? "article-editor-grid" : "article-editor-wide"}><main className="min-w-0"><div className="article-title-area"><p className="kicker text-brand-red">TECH HUB · EDITORIAL</p><textarea aria-label="Article headline" placeholder="Give your story a headline…" value={form.title} rows={2} onChange={e => setForm(f => ({ ...f, title: e.target.value, slug: slugTouched ? f.slug : slugify(e.target.value) }))} /><p className="text-sm text-muted-foreground">{documentText(form.content).split(/\s+/).filter(Boolean).length} words · Formatting shortcuts: Ctrl/⌘ B, I, U</p></div><VisualEditor key={editorKey} initial={form.content} onChange={v => update("content", v)} canUpload={permissions.includes("media.manage")} /></main>
        {sidebar && <aside className="article-settings"><details open><summary>Article settings</summary>{input("slug", "URL slug")}<p className="text-xs break-all">/{form.section}/{form.slug || "your-story"}</p><label className="editor-setting">Excerpt<textarea rows={4} value={form.excerpt} onChange={e => update("excerpt", e.target.value)} /></label><label className="editor-setting">Section<select value={form.section} onChange={e => update("section", e.target.value as ArticleSection)}>{ARTICLE_SECTIONS.map(s => <option key={s} value={s}>{SECTION_META[s].label}</option>)}</select></label>{input("category", "Category")}{permissions.includes("articles.editAll") ? input("author", "Author") : <p>Author: {form.author}</p>}<label className="editor-setting">Tags (comma separated)<input value={form.tags.join(",")} onChange={e => update("tags", e.target.value.split(","))} /></label>{input("publishedAt", "Publication date", "datetime-local")}{input("readTime", "Read time (optional)")}{permissions.includes("articles.feature") && <label className="flex gap-2 py-3"><input type="checkbox" checked={form.featured} onChange={e => update("featured", e.target.checked)} />Feature on homepage</label>}</details>
        <details open><summary>Featured image</summary>{permissions.includes("media.manage") ? <ImageField value={form.imageUrl} onChange={v => update("imageUrl", v)} /> : input("imageUrl", "Image URL")}{input("imageAlt", "Alt text")}{input("imageCredit", "Image credit")}</details>
        <details><summary>SEO & social preview</summary>{input("seoTitle", "SEO title")}<label className="editor-setting">Meta description<textarea value={form.metaDescription} onChange={e => update("metaDescription", e.target.value)} rows={4} maxLength={320} /></label><p className="text-xs">{form.metaDescription.length} characters · aim for around 150–160.</p><div className="rounded border p-3 mt-4"><p className="text-xs">mytechhub.online/{form.section}/{form.slug}</p><h3 className="text-lg text-blue-700">{form.seoTitle || form.title || "Your article title"}</h3><p className="text-sm">{form.metaDescription || form.excerpt}</p>{form.imageUrl && <img src={form.imageUrl} alt={form.imageAlt} className="mt-3 rounded" />}</div></details></aside>}</div>
        {preview && createPortal(<div role="dialog" aria-modal="true" aria-label="Article preview" className="editor-preview"><header><button className="editor-tool" onClick={() => setPreview("desktop")}>Desktop</button><button className="editor-tool" onClick={() => setPreview("mobile")}>Mobile</button><button className="editor-tool" onClick={() => setPreview("")}>Close preview</button><span className="text-sm">Unsaved preview · not public</span></header><article style={{ maxWidth: preview === "mobile" ? 390 : 820 }}><p className="kicker text-brand-red">{form.category}</p><h1>{form.title || "Untitled article"}</h1><p className="text-xl text-muted-foreground">{form.excerpt}</p><p className="my-4 text-sm">{form.author} · {form.publishedAt.slice(0, 10)}</p>{form.imageUrl && <figure><img src={form.imageUrl} alt={form.imageAlt} /><figcaption>{form.imageCredit}</figcaption></figure>}<Markdown content={form.content} /></article></div>, document.body)}
    </div>
}
