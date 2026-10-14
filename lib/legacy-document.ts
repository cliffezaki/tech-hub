import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import { readDocument, type RichNode } from "@/lib/rich-content"
interface MdNode { type: string; value?: string; depth?: number; url?: string; alt?: string; title?: string; ordered?: boolean; start?: number; lang?: string; identifier?: string; children?: MdNode[] }
export function editorDocument(content: string): RichNode {
    const rich = readDocument(content)
    if (rich) return rich
    const tree = unified().use(remarkParse).use(remarkGfm).parse(content) as MdNode
    const definitions = new Map<string, MdNode>()
    for (const n of tree.children || []) if (n.type === "definition") definitions.set(n.identifier || "", n)
    function convert(n: MdNode): RichNode[] {
        const children = () => (n.children || []).flatMap(convert)
        const mark = (type: string, attrs?: Record<string, unknown>) => children().map(c => ({ ...c, marks: [...(c.marks || []), { type, attrs }] }))
        switch (n.type) {
            case "text": return n.value ? [{ type: "text", text: n.value }] : []
            case "paragraph": {
                // ProseMirror images are blocks; split mixed image/text paragraphs losslessly.
                const out: RichNode[] = []; let inline: RichNode[] = []
                for (const child of children()) { if (child.type === "image") { if (inline.length) out.push({ type: "paragraph", content: inline }); inline = []; out.push(child) } else inline.push(child) }
                if (inline.length || !out.length) out.push({ type: "paragraph", content: inline })
                return out
            }
            case "heading": return [{ type: "heading", attrs: { level: n.depth }, content: children() }]
            case "strong": return mark("bold")
            case "emphasis": return mark("italic")
            case "delete": return mark("strike")
            case "inlineCode": return [{ type: "text", text: n.value || " ", marks: [{ type: "code" }] }]
            case "link": return mark("link", { href: n.url })
            case "linkReference": return mark("link", { href: definitions.get(n.identifier || "")?.url })
            case "imageReference": return convert({ ...n, type: "image", url: definitions.get(n.identifier || "")?.url })
            case "image": return [{ type: "image", attrs: { src: n.url, alt: n.alt || "", caption: n.title || "" } }]
            case "break": return [{ type: "hardBreak" }]
            case "thematicBreak": return [{ type: "horizontalRule" }]
            case "code": return [{ type: "codeBlock", attrs: { language: n.lang }, content: n.value ? [{ type: "text", text: n.value }] : [] }]
            case "blockquote": return [{ type: "blockquote", content: children() }]
            case "list": return [{ type: n.ordered ? "orderedList" : "bulletList", attrs: { start: n.start || 1 }, content: children() }]
            case "listItem": return [{ type: "listItem", content: children() }]
            case "table": return [{ type: "table", content: (n.children || []).map((row, index) => ({ type: "tableRow", content: (row.children || []).map(cell => ({ type: index === 0 ? "tableHeader" : "tableCell", content: [{ type: "paragraph", content: (cell.children || []).flatMap(convert) }] })) })) }]
            case "definition": return []
            case "root": return children()
            default: throw new Error(`This legacy article contains ${n.type} content that needs a reviewed conversion. The original has been kept intact.`)
        }
    }
    return { type: "doc", content: convert(tree).length ? convert(tree) : [{ type: "paragraph" }] }
}
