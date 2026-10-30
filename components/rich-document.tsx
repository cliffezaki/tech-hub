/* Shared by the writing preview and published articles; never interprets raw HTML. */
import { createElement, Fragment, type CSSProperties, type ReactNode } from "react"
import { color, embedUrl, safeUrl, type RichNode } from "@/lib/rich-content"
export function RichDocument({ document }: { document: RichNode }) {
    function render(n: RichNode, key: number): ReactNode {
        const a = n.attrs || {}
        const children = n.content?.map(render)
        const style: CSSProperties = { textAlign: ["left", "center", "right", "justify"].includes(String(a.textAlign)) ? a.textAlign as CSSProperties["textAlign"] : undefined }
        if (n.type === "text") {
            let value: ReactNode = n.text
            for (const m of n.marks || []) {
                const tags: Record<string, string> = { bold: "strong", italic: "em", underline: "u", strike: "s", code: "code" }
                if (tags[m.type]) value = createElement(tags[m.type], {}, value)
                if (m.type === "link") value = <a href={safeUrl(m.attrs?.href) || undefined} rel="noopener noreferrer">{value}</a>
                if (m.type === "textStyle") value = <span style={{ color: color(m.attrs?.color) }}>{value}</span>
                if (m.type === "highlight") value = <mark style={{ backgroundColor: color(m.attrs?.color) || "#fef08a" }}>{value}</mark>
            }
            return <Fragment key={key}>{value}</Fragment>
        }
        if (n.type === "image") return <figure key={key} style={{ width: `${Math.min(100, Math.max(20, Number(a.width) || 100))}%`, marginLeft: a.align === "right" || a.align === "center" ? "auto" : 0, marginRight: a.align === "center" ? "auto" : 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={safeUrl(a.src, true) || undefined} alt={String(a.alt || "")} loading="lazy" style={{ width: "100%", aspectRatio: ["1 / 1", "16 / 9", "4 / 3"].includes(String(a.ratio)) ? String(a.ratio) : undefined, objectFit: "cover", objectPosition: `${Number(a.focalX) || 50}% ${Number(a.focalY) || 50}%` }} />
            {a.caption ? <figcaption>{String(a.caption)}</figcaption> : null}
        </figure>
        if (n.type === "gallery") return <div key={key} className="rich-gallery">{children}</div>
        if (n.type === "media") {
            const url = safeUrl(a.src, true), embed = embedUrl(url)
            return <figure key={key}>{a.kind === "video" ? <video src={url || undefined} controls preload="metadata" /> : a.kind === "audio" ? <audio src={url || undefined} controls preload="metadata" /> : embed ? <iframe src={embed} title={String(a.caption || "Embedded media")} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allow="fullscreen; picture-in-picture" sandbox="allow-scripts allow-same-origin allow-presentation" className="rich-embed" /> : <a href={url || undefined} rel="noopener noreferrer" target="_blank">{String(a.caption || "View embedded post")}</a>}{a.caption ? <figcaption>{String(a.caption)}</figcaption> : null}</figure>
        }
        if (n.type === "buttonLink") return <p key={key} style={style}><a className="rich-button" href={safeUrl(a.href) || undefined}>{String(a.label || "Learn more")}</a></p>
        if (n.type === "hardBreak") return <br key={key} />
        if (n.type === "horizontalRule") return <hr key={key} />
        if (n.type === "codeBlock") return <pre key={key}><code>{children}</code></pre>
        if (n.type === "table") return <div key={key} className="tableWrapper"><table><tbody>{children}</tbody></table></div>
        const tags: Record<string, string> = { paragraph: "p", bulletList: "ul", orderedList: "ol", listItem: "li", blockquote: "blockquote", pullQuote: "blockquote", tableRow: "tr", tableCell: "td", tableHeader: "th" }
        if (n.type === "heading") return createElement(`h${Math.min(6, Math.max(1, Number(a.level) || 2))}`, { key, style }, children)
        if (tags[n.type]) return createElement(tags[n.type], { key, style, className: n.type === "pullQuote" ? "rich-pullquote" : undefined, ...(n.type === "orderedList" ? { start: Number(a.start) || 1 } : {}), ...(["tableCell", "tableHeader"].includes(n.type) ? { colSpan: Math.min(20, Math.max(1, Number(a.colspan) || 1)), rowSpan: Math.min(100, Math.max(1, Number(a.rowspan) || 1)) } : {}) }, children)
        return <Fragment key={key}>{children}</Fragment>
    }
    return <div className="rich-article">{document.content?.map(render)}</div>
}
