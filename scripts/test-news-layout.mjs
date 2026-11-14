import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import ts from "typescript"
const exports = {}
vm.runInNewContext(ts.transpileModule(await readFile("lib/news-layout.ts", "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, Set, Date })
const articles = Array.from({ length: 30 }, (_, i) => ({ id: String(i), category: i % 2 ? "AI" : "Security", publishedAt: new Date(Date.UTC(2026, 10, 9) - i * 86400000).toISOString() }))
for (const size of [0, 1, 2, 6, 9, 30]) {
 const { hero, headlines, feed } = exports.newsLayout(articles.slice(0, size))
 assert.equal(feed.length > 0, size > 0)
 if (size > 1) assert.equal(new Set([hero.id, ...headlines.map(a => a.id), ...feed.map(a => a.id)]).size, size)
 assert(feed.every((a,i) => !i || Date.parse(a.publishedAt) <= Date.parse(feed[i-1].publishedAt)))
}
assert.equal(exports.newsLayout(articles.slice(0,6)).feed.length, 3)
const filtered = exports.newsLayout(articles, "AI")
assert.equal(filtered.hero, undefined)
assert.equal(filtered.headlines.length, 0)
assert.equal(filtered.feed.length, 15)
assert(filtered.feed.every(a => a.category === "AI"))
assert.equal(exports.newsLayout(articles, "Missing").feed.length, 0)
console.log("PASS News layout: empty, single, small and paginated collections; no unnecessary duplicates; category filtering and date order")
