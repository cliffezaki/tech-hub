"use client"
import { useRef, useState } from "react"
import { EditorContent, useEditor, useEditorState } from "@tiptap/react"
import { Node, mergeAttributes, type JSONContent } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import Image from "@tiptap/extension-image"
import { TableKit } from "@tiptap/extension-table"
import TextAlign from "@tiptap/extension-text-align"
import { TextStyle, Color } from "@tiptap/extension-text-style"
import Highlight from "@tiptap/extension-highlight"
import Placeholder from "@tiptap/extension-placeholder"
import DragHandle from "@tiptap/extension-drag-handle-react"
import { editorDocument } from "@/lib/legacy-document"
import { embedUrl, safeUrl, writeDocument } from "@/lib/rich-content"
import type { MediaItem } from "@/lib/types"

const ArticleImage = Image.extend({
    addAttributes() { return { ...this.parent?.(), caption: { default: "" }, width: { default: 100 }, align: { default: "center" }, ratio: { default: "auto" }, focalX: { default: 50 }, focalY: { default: 50 } } },
    renderHTML({ HTMLAttributes: a }) { return ["figure", { style: `width:${Number(a.width) || 100}%;margin-left:${a.align === "left" ? "0" : "auto"};margin-right:${a.align === "right" ? "0" : "auto"}` }, ["img", { src: safeUrl(a.src, true), alt: a.alt || "", style: `width:100%;object-fit:cover;aspect-ratio:${["1 / 1", "16 / 9", "4 / 3"].includes(a.ratio) ? a.ratio : "auto"};object-position:${Number(a.focalX) || 50}% ${Number(a.focalY) || 50}%` }], ["figcaption", {}, a.caption || ""]] },
})
const Media = Node.create({
    name: "media", group: "block", atom: true, draggable: true,
    addAttributes() { return { src: { default: "" }, kind: { default: "embed" }, caption: { default: "" } } },
    parseHTML() { return [{ tag: "figure[data-media]" }] },
    renderHTML({ HTMLAttributes: a }) { const url = safeUrl(a.src, true), embed = embedUrl(url); return ["figure", { "data-media": "true" }, a.kind === "video" ? ["video", { src: url, controls: "true", preload: "metadata" }] : a.kind === "audio" ? ["audio", { src: url, controls: "true" }] : embed ? ["iframe", { src: embed, title: a.caption || "Embedded media", class: "rich-embed", sandbox: "allow-scripts allow-same-origin allow-presentation" }] : ["a", { href: url }, a.caption || "View embedded post"], ["figcaption", {}, a.caption || ""]] },
})
const PullQuote = Node.create({ name: "pullQuote", group: "block", content: "paragraph+", defining: true, parseHTML() { return [{ tag: "blockquote.rich-pullquote" }] }, renderHTML({ HTMLAttributes }) { return ["blockquote", mergeAttributes(HTMLAttributes, { class: "rich-pullquote" }), 0] } })
const Gallery = Node.create({ name: "gallery", group: "block", content: "image+", draggable: true, parseHTML() { return [{ tag: "div.rich-gallery" }] }, renderHTML() { return ["div", { class: "rich-gallery" }, 0] } })
const ButtonLink = Node.create({ name: "buttonLink", group: "block", atom: true, draggable: true, addAttributes() { return { label: { default: "Learn more" }, href: { default: "" } } }, parseHTML() { return [{ tag: "p[data-button-link]" }] }, renderHTML({ HTMLAttributes: a }) { return ["p", { "data-button-link": "true" }, ["a", { class: "rich-button", href: safeUrl(a.href) }, a.label]] } })

export function VisualEditor({ initial, onChange, canUpload }: { initial: string; onChange: (value: string) => void; canUpload: boolean }) {
    const [message, setMessage] = useState("")
    const [panel, setPanel] = useState("")
    const [library, setLibrary] = useState<MediaItem[]>([])
    const [source, setSource] = useState("")
    const [label, setLabel] = useState("")
    const [kind, setKind] = useState("image")
    const [busy, setBusy] = useState(false)
    const upload = useRef<HTMLInputElement>(null)
    const [document] = useState(() => { try { return { content: editorDocument(initial), error: "" } } catch (e) { return { content: null, error: (e as Error).message } } })
    const editor = useEditor({ immediatelyRender: false, editable: !document.error, extensions: [StarterKit.configure({ link: { openOnClick: false } }), ArticleImage, TableKit.configure({ table: { resizable: true } }), TextAlign.configure({ types: ["heading", "paragraph"] }), TextStyle, Color, Highlight.configure({ multicolor: true }), Placeholder.configure({ placeholder: "Start writing your story…" }), Media, PullQuote, ButtonLink, Gallery], content: document.content as JSONContent || undefined, onUpdate: ({ editor }) => onChange(writeDocument(editor.getJSON())), editorProps: { attributes: { class: "rich-article min-h-[60vh] outline-none", "aria-label": "Article content", role: "textbox", "aria-multiline": "true" } } })
    useEditorState({ editor, selector: ({ editor }) => editor ? { selection: editor.state.selection.from, transaction: editor.state.doc.content.size, active: ["bold", "italic", "underline", "strike", "bulletList", "orderedList"].map(x => editor.isActive(x)).join(), color: editor.getAttributes("textStyle").color } : null })
    if (document.error) return <div role="alert" className="rounded border border-amber-400 p-5">{document.error} Saving remains disabled until this conversion is reviewed.</div>
    if (!editor) return <p className="p-8">Preparing your writing space…</p>
    const button = (name: string, action: () => void, active = false, disabled = false) => <button type="button" key={name} title={name} aria-label={name} aria-pressed={active} disabled={disabled} className="editor-tool" onMouseDown={e => e.preventDefault()} onClick={action}>{name}</button>
    const chain = () => editor.chain().focus()
    function block(action: "up" | "down" | "copy" | "remove") {
        if (!editor) return
        const { $from } = editor.state.selection
        const index = $from.index(0)
        const content = [...(editor.getJSON().content || [])]
        if (action === "copy") content.splice(index + 1, 0, structuredClone(content[index]))
        if (action === "remove") content.splice(index, 1)
        if (action === "up" && index > 0) [content[index - 1], content[index]] = [content[index], content[index - 1]]
        if (action === "down" && index < content.length - 1) [content[index + 1], content[index]] = [content[index], content[index + 1]]
        editor.commands.setContent({ type: "doc", content: content.length ? content : [{ type: "paragraph" }] })
    }
    async function showMedia() { setPanel("media"); setMessage(""); try { const r = await fetch("/api/media"); const d = await r.json(); if (!r.ok) throw new Error(d.error); setLibrary(Array.isArray(d) ? d : []) } catch { setMessage("Media library could not load. Try again.") } }
    function insert(url: string, name = label) {
        if (!safeUrl(url, true)) { setMessage("Use an HTTPS media URL or upload a file."); return }
        if (kind === "image") chain().insertContent({ type: "image", attrs: { src: url, alt: name, caption: "" } }).run()
        else chain().insertContent({ type: "media", attrs: { src: url, kind, caption: name } }).run()
        setPanel(""); setSource(""); setLabel("")
    }
    async function uploadFile(file: File) {
        if (file.size > 4 * 1024 * 1024) { setMessage("Upload files up to 4MB. For larger videos, use a YouTube or Vimeo link."); return }
        setBusy(true); setMessage("")
        try { const body = new FormData(); body.append("file", file); const r = await fetch("/api/media", { method: "POST", body }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Upload failed"); insert(d.url, file.type.startsWith("image/") ? "" : file.name) } catch (e) { setMessage((e as Error).message) } finally { setBusy(false); if (upload.current) upload.current.value = "" }
    }
    const image = editor.isActive("image") ? editor.getAttributes("image") : null
    const selectedMedia = editor.isActive("media") ? editor.getAttributes("media") : null
    const selectedButton = editor.isActive("buttonLink") ? editor.getAttributes("buttonLink") : null
    return <section className="visual-editor">
        <div className="editor-toolbar" role="toolbar" aria-label="Text formatting">
            <select aria-label="Text style" className="editor-tool" value={editor.isActive("heading") ? editor.getAttributes("heading").level : "paragraph"} onChange={e => e.target.value === "paragraph" ? chain().setParagraph().run() : chain().toggleHeading({ level: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 | 6 }).run()}><option value="paragraph">Paragraph</option>{[1, 2, 3, 4, 5, 6].map(n => <option key={n} value={n}>Heading {n}</option>)}</select>
            {button("Bold", () => { chain().toggleBold().run() }, editor.isActive("bold"))}
            {button("Italic", () => { chain().toggleItalic().run() }, editor.isActive("italic"))}
            {button("Underline", () => { chain().toggleUnderline().run() }, editor.isActive("underline"))}
            {button("Strike", () => { chain().toggleStrike().run() }, editor.isActive("strike"))}
            {button("Link", () => { setSource(editor.getAttributes("link").href || ""); setPanel("link") }, editor.isActive("link"))}
            {button("Bullets", () => { chain().toggleBulletList().run() }, editor.isActive("bulletList"))}
            {button("Numbered", () => { chain().toggleOrderedList().run() }, editor.isActive("orderedList"))}
            <select aria-label="Text alignment" className="editor-tool" onChange={e => chain().setTextAlign(e.target.value).run()} defaultValue="left">{["left", "center", "right", "justify"].map(v => <option key={v}>{v}</option>)}</select>
            <label className="editor-tool">Text <input type="color" aria-label="Text color" defaultValue="#171717" onChange={e => chain().setColor(e.target.value).run()} /></label>
            <label className="editor-tool">Highlight <input type="color" aria-label="Highlight color" defaultValue="#fef08a" onChange={e => chain().setHighlight({ color: e.target.value }).run()} /></label>
            {button("Clear format", () => { chain().unsetAllMarks().run() })}
            {button("Undo", () => { chain().undo().run() }, false, !editor.can().undo())}{button("Redo", () => { chain().redo().run() }, false, !editor.can().redo())}
        </div>
        <div className="editor-blockbar" role="toolbar" aria-label="Insert and arrange blocks">
            <select aria-label="Insert block" className="editor-tool" value="" onChange={e => {
                const v = e.target.value
                if (v === "media") { void showMedia(); return }
                if (v === "buttonLink") { setSource(""); setLabel(""); setPanel("button"); return }
                if (v === "table") { chain().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); return }
                if (v === "gallery") { chain().insertContent({ type: "gallery", content: [1, 2].map(() => ({ type: "image", attrs: { src: "/editor-image-placeholder.svg", alt: "Select this image to replace it" } })) }).run(); return }
                chain().insertContent(v === "horizontalRule" ? { type: v } : { type: v, content: v === "blockquote" || v === "pullQuote" ? [{ type: "paragraph", content: [{ type: "text", text: "Your quotation" }] }] : [] }).run()
            }}><option value="">＋ Add block</option><option value="paragraph">Paragraph</option><option value="media">Image, video, audio or embed</option><option value="gallery">Gallery</option><option value="table">Table</option><option value="blockquote">Quote</option><option value="pullQuote">Pull quote</option><option value="codeBlock">Code snippet</option><option value="horizontalRule">Divider</option><option value="buttonLink">Button</option></select>
            {button("Move up", () => block("up"))}{button("Move down", () => block("down"))}{button("Duplicate", () => block("copy"))}{button("Remove block", () => block("remove"))}
            {editor.isActive("table") && <>{button("Add row", () => { chain().addRowAfter().run() })}{button("Add column", () => { chain().addColumnAfter().run() })}{button("Delete row", () => { chain().deleteRow().run() })}{button("Delete column", () => { chain().deleteColumn().run() })}{button("Merge cells", () => { chain().mergeCells().run() })}{button("Split cell", () => { chain().splitCell().run() })}</>}
        </div>
        {selectedMedia && <div className="editor-context" aria-label="Media settings"><label>Media URL<input value={selectedMedia.src} onChange={e => chain().updateAttributes("media", { src: e.target.value }).run()} /></label><label>Caption<input value={selectedMedia.caption} onChange={e => chain().updateAttributes("media", { caption: e.target.value }).run()} /></label></div>}
        {selectedButton && <div className="editor-context" aria-label="Button settings"><label>Button label<input value={selectedButton.label} onChange={e => chain().updateAttributes("buttonLink", { label: e.target.value }).run()} /></label><label>Button URL<input value={selectedButton.href} onChange={e => chain().updateAttributes("buttonLink", { href: e.target.value }).run()} /></label></div>}
        {image && <div className="editor-context" aria-label="Image settings">
            {button("Add another image", () => { chain().insertContentAt(editor.state.selection.to, { type: "image", attrs: { ...image, src: "/editor-image-placeholder.svg", alt: "", caption: "" } }).run() })}
            <label>Image URL<input value={image.src || ""} onChange={e => chain().updateAttributes("image", { src: e.target.value }).run()} /></label>
            <label>Alt text<input value={image.alt || ""} onChange={e => chain().updateAttributes("image", { alt: e.target.value }).run()} /></label>
            <label>Caption<input value={image.caption || ""} onChange={e => chain().updateAttributes("image", { caption: e.target.value }).run()} /></label>
            <label>Width<input type="range" min="20" max="100" value={image.width} onChange={e => chain().updateAttributes("image", { width: Number(e.target.value) }).run()} /></label>
            <label>Alignment<select value={image.align} onChange={e => chain().updateAttributes("image", { align: e.target.value }).run()}>{["left", "center", "right"].map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Crop<select value={image.ratio} onChange={e => chain().updateAttributes("image", { ratio: e.target.value }).run()}>{["auto", "1 / 1", "16 / 9", "4 / 3"].map(v => <option key={v}>{v}</option>)}</select></label>
            <label>Crop horizontal focus<input type="range" min="1" max="100" value={image.focalX} onChange={e => chain().updateAttributes("image", { focalX: Number(e.target.value) }).run()} /></label>
            <label>Crop vertical focus<input type="range" min="1" max="100" value={image.focalY} onChange={e => chain().updateAttributes("image", { focalY: Number(e.target.value) }).run()} /></label>
        </div>}
        {panel && <div className="editor-insert" role="region" aria-label="Insert content">
            <div className="flex justify-between"><strong>{panel === "media" ? "Insert media" : panel === "link" ? "Add a link" : "Add a button"}</strong><button type="button" onClick={() => setPanel("")}>Close</button></div>
            {panel === "media" && <><label>Media type<select value={kind} onChange={e => setKind(e.target.value)}>{["image", "video", "audio", "embed"].map(v => <option key={v}>{v}</option>)}</select></label><p className="text-sm">Embed YouTube, Vimeo or Instagram. Other social posts open as source links. Upload images, MP4/WebM videos and MP3 audio up to 4MB.</p>{canUpload && <><button type="button" className="editor-tool" disabled={busy} onClick={() => upload.current?.click()}>{busy ? "Uploading…" : "Upload from computer"}</button><input ref={upload} type="file" hidden accept={kind === "image" ? "image/jpeg,image/png,image/webp,image/gif,image/avif" : kind === "video" ? "video/mp4,video/webm" : "audio/mpeg"} onChange={e => { if (e.target.files?.[0]) void uploadFile(e.target.files[0]) }} /></>}<div className="max-h-36 overflow-y-auto grid grid-cols-2 gap-2">{library.filter(m => kind !== "image" || /\.(jpg|jpeg|png|webp|gif|avif|svg)(\?|$)/i.test(m.url)).map(m => <button className="rounded border p-2 text-left text-xs truncate" type="button" key={m.id} onClick={() => insert(m.url)}>{m.filename}</button>)}</div></>}
            <label>URL<input className="cms-input" value={source} onChange={e => setSource(e.target.value)} placeholder="https://…" /></label>
            {panel !== "link" && <label>{kind === "image" && panel === "media" ? "Alt text" : "Label / caption"}<input className="cms-input" value={label} onChange={e => setLabel(e.target.value)} /></label>}
            <button className="editor-tool" type="button" onClick={() => { if (panel === "media") insert(source); else if (!safeUrl(source)) setMessage("Enter a valid link."); else { if (panel === "link") chain().extendMarkRange("link").setLink({ href: source }).run(); else chain().insertContent({ type: "buttonLink", attrs: { href: source, label: label || "Learn more" } }).run(); setPanel("") } }}>Insert</button>
            {panel === "link" && button("Remove link", () => { chain().unsetLink().run(); setPanel("") })}
            {message && <p role="alert">{message}</p>}
        </div>}
        <div className="editor-paper"><DragHandle editor={editor}><button type="button" aria-label="Drag block" className="editor-drag">⠿</button></DragHandle><EditorContent editor={editor} /></div>
    </section>
}
