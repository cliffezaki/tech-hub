import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import ts from "typescript"
import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
function load(source, imports = {}) {
    const exports = {}
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, { exports, URL, require: name => { if (name in imports) return imports[name]; throw Error(name) } })
    return exports
}
const rich = load(await readFile("lib/rich-content.ts", "utf8"))
const legacy = load(await readFile("lib/legacy-document.ts", "utf8"), { "@/lib/rich-content": rich, unified: { unified }, "remark-parse": { default: remarkParse }, "remark-gfm": { default: remarkGfm } })
const source = "## Heading\n\nA **bold** and *italic* paragraph with [a link](https://example.test).\n\n![Image alt](https://example.test/a.png \"Image caption\")\n\n> Quote\n\n- One\n- Two\n\n| Column | Other |\n| --- | --- |\n| Cell | Value |\n\n```js\nconst x = 1\n```"
const doc = legacy.editorDocument(source)
const stored = rich.writeDocument(doc)
assert.equal(JSON.stringify(rich.readDocument(stored)), JSON.stringify(doc))
assert(rich.documentText(stored).includes("Heading"))
assert(doc.content.some(n => n.type === "table"))
assert(doc.content.some(n => n.type === "image" && n.attrs.alt === "Image alt" && n.attrs.caption === "Image caption"))
assert(doc.content.some(n => n.type === "codeBlock"))
assert.throws(() => legacy.editorDocument("<script>alert(1)</script>"), /kept intact/)
assert.throws(() => rich.readDocument(rich.RICH_PREFIX + '{"type":"doc","content":[{"type":"script"}]}'))
for (const url of ["javascript:alert(1)", "data:text/html,hello", "//evil.test", "/\\evil.test", "https://test\n.example"]) assert.equal(rich.safeUrl(url), "")
assert.equal(rich.safeUrl("https://example.test/image.png", true), "https://example.test/image.png")
assert.equal(rich.embedUrl("https://youtube.com.evil.test/watch?v=abcdefghijk"), "")
assert.equal(rich.embedUrl("https://youtu.be/abcdefghijk"), "https://www.youtube-nocookie.com/embed/abcdefghijk")
assert.equal(rich.color("red; background:url(javascript:alert(1))"), undefined)
console.log("PASS: legacy conversion, lossless document round-trip, tables/images/marks/code, rejection of unsupported legacy HTML and unsafe URLs/styles.")
