import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import ts from "typescript"

const now = Date.parse("2026-11-09T12:00:00Z")
const day = 86400000
const article = (id, section, age, extra = {}) => ({
    id, section, slug: id, title: id, content: "", status: "published",
    publishedAt: new Date(now - age * day).toISOString(), ...extra,
})
const articles = [
    article("boundary", "news", 30), article("too-old", "news", 30.001),
    article("future", "news", -1), article("demo", "news", 1, { demo: true }),
    article("draft", "news", 1, { status: "draft" }),
    article("review", "reviews", 2), article("kenya", "tech-kenya", 3),
    ...Array.from({ length: 7 }, (_, i) => article(`news-${i}`, "news", i + 1)),
]
const exports = {}
class Clock extends Date { static now() { return now } }
const imports = {
    "server-only": {}, react: { cache: fn => fn },
    "@/lib/article-visibility": { articleVisible: a => a.status === "published" },
    "@/lib/store": { getStore: () => ({ listArticles: async () => articles }) },
    "@/lib/builtin-pages": {}, "@/lib/types": {},
}
vm.runInNewContext(ts.transpileModule(await readFile("lib/content.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports, Date: Clock, require: name => {
    if (!(name in imports)) throw Error(`Unexpected import: ${name}`)
    return imports[name]
} })
const ids = async section => Array.from(await exports.getTickerArticles(section), a => a.id)
assert.deepEqual(await ids("reviews"), ["review"])
assert.deepEqual(await ids("tech-kenya"), ["kenya"])
assert.deepEqual(await ids("news"), Array.from({ length: 6 }, (_, i) => `news-${i}`))
assert.equal((await ids()).length, 6)
articles.splice(0, articles.length, article("boundary", "news", 30), article("old", "news", 30.001))
assert.deepEqual(await ids("news"), ["boundary"])
articles.splice(0, articles.length)
assert.deepEqual(await ids(), [])
console.log("PASS: 30-day boundary, section isolation, newest-first order, six-headline limit, demo/draft/future exclusions and empty results.")
