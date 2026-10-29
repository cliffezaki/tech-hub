import assert from "node:assert/strict"
import { readFile, mkdtemp, mkdir, writeFile } from "node:fs/promises"
import fs from "node:fs"
import path from "node:path"
import os from "node:os"
import crypto from "node:crypto"
import vm from "node:vm"
import ts from "typescript"
function load(source, imports, extra = {}) {
    const exports = {}
    vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, { exports, Buffer, URL, Request, AbortSignal, Uint8Array, console: { error() {} }, require(name) { if (name === "server-only") return {}; if (name in imports) return imports[name]; throw Error(`Unexpected import: ${name}`) }, ...extra })
    return exports
}
const jsonResponse = { NextResponse: { json: (data, init = {}) => ({ data, status: init.status || 200, headers: init.headers || {} }) } }
const contact = load(await readFile("lib/contact.ts", "utf8"), {})
const valid = { name: "Test Reader", email: "reader@example.test", subject: "Story tip", message: "A legitimate message from a reader." }
assert(contact.contactMessage(valid))
for (const bad of [null, [], { ...valid, email: "reader@example.test\r\nBcc: leak@example.test" }, { ...valid, subject: "Subject\nBcc: leak@example.test" }, { ...valid, message: "short" }, { ...valid, message: "x".repeat(5001) }, { ...valid, websiteTrap: "bot" }]) assert.equal(contact.contactMessage(bad), null)
let allowed = true, configured = true, rate = true, failed = false, recipient = "team@example.test"
const delivered = [], scopes = []
class DeliveryError extends Error {}
const route = load(await readFile("app/api/contact/route.ts", "utf8"), {
    "next/server": jsonResponse, "node:crypto": crypto,
    "@/lib/accounts": { sameOrigin: async () => allowed, throttle: async (scope, limit) => { scopes.push([scope, limit]); return rate } },
    "@/lib/platform-store": { platformReady: () => configured },
    "@/lib/email": { emailDeliveryConfigured: () => configured, EmailDeliveryUnavailable: DeliveryError, sendContactEmail: async (...args) => { if (failed) throw Error("smtp secret should never leak"); delivered.push(args) } },
    "@/lib/store": { getStore: () => ({ getSettings: async () => ({ contactEmail: recipient }) }) },
    "@/lib/contact": contact,
    "@/lib/contact-guard": {contactToken:()=>"test-token",validContactToken:()=>true,contactNetworkKey:()=>"test-network"},
})
const request = (body = valid, options = {}) => new Request("https://example.test/api/contact", { method: "POST", headers: { "Content-Type": "application/json", ...options.headers }, body: typeof body === "string" ? body : JSON.stringify(body) })
assert.equal((await route.POST(request())).status, 200)
assert.equal(delivered[0][0], "team@example.test")
assert.equal(delivered[0][1].email, valid.email)
assert(scopes.some(([scope, limit]) => scope === "contact:site" && limit === 30))
allowed = false; assert.equal((await route.POST(request())).status, 403); allowed = true
assert.equal((await route.POST(request("broken json"))).status, 400)
assert.equal((await route.POST(request({ ...valid, message: "x".repeat(25000) }))).status, 413)
assert.equal((await route.POST(request(valid, { headers: { "Content-Type": "text/plain" } }))).status, 415)
configured = false; assert.equal((await route.POST(request())).status, 503); configured = true
recipient = "invalid\r\nBcc: leak@example.test"; assert.equal((await route.POST(request())).status, 503); recipient = "team@example.test"
rate = false; const limited = await route.POST(request()); assert.equal(limited.status, 429); assert.equal(limited.headers["Retry-After"], "900"); rate = true
failed = true; const failure = await route.POST(request()); assert.equal(failure.status, 503); assert(!JSON.stringify(failure).includes("smtp secret")); assert.equal(delivered.length, 1)

const types = load(await readFile("lib/types.ts", "utf8"), {})
const rich = load(await readFile("lib/rich-content.ts", "utf8"), {})
const normalize = load(await readFile("lib/store/normalize.ts", "utf8"), { "@/lib/demo-photos": load(await readFile("lib/demo-photos.ts", "utf8"), {}), "@/lib/types": types, "@/lib/rich-content": rich, "node:crypto": crypto })
const ids = Array.from({ length: 100 }, () => normalize.generateId())
assert.equal(new Set(ids).size, ids.length); assert(ids.every(id => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(id)))
const temp = await mkdtemp(path.join(os.tmpdir(), "techhub-security-review-"))
await mkdir(path.join(temp, "articles")); await mkdir(path.join(temp, "pages")); await writeFile(path.join(temp, "settings.json"), JSON.stringify({ secret: "MUST_NOT_LEAK" }))
const store = load(await readFile("lib/store/file-store.ts", "utf8"), { fs, path, "@/lib/types": types, "./normalize": normalize }, { process: { env: { NODE_ENV: "test", CMS_TEST_CONTENT_DIR: temp }, cwd: () => temp } }).createFileStore()
for (const id of ["../settings", "../../settings", "..\\settings", "/settings", "x/y", "x%2f..%2fsettings"]) {
    assert.equal(await store.getArticle(id), null); assert.equal(await store.getPage(id), null)
    assert.equal(await store.deleteArticle(id), false); assert.equal(await store.deletePage(id), false)
    assert.equal(await store.updateArticle(id, { title: "denied" }), null); assert.equal(await store.updatePage(id, { title: "denied" }), null)
}
assert.equal(JSON.parse(await readFile(path.join(temp, "settings.json"))).secret, "MUST_NOT_LEAK")
const api = load(await readFile("lib/api.ts", "utf8"), { "next/cache": {}, "next/server": jsonResponse, "@/lib/accounts": {}, "@/lib/store": {} })
const error = api.handleError(Error("SUPABASE_SECRET_KEY=must-not-leak"), "Could not save changes.")
assert.equal(error.status, 500); assert.equal(error.data.error, "Could not save changes.")
assert(!JSON.stringify(error).includes("must-not-leak"))
// Exercise the actual serializer expression used by the article script element.
const article = await readFile("components/article-detail-page.tsx", "utf8")
const expression = article.match(/__html:\s*(JSON\.stringify\(structuredData\)\.replace\([\s\S]*?\)),\s*\}\}/)[1]
const escaped = vm.runInNewContext(expression, { structuredData: { headline: '</script><script>alert("x")</script>' } })
assert(!escaped.includes("<")); assert.equal(JSON.parse(escaped).headline, '</script><script>alert("x")</script>')
console.log("PASS: bounded contact API, validation/header injection, fixed recipient, rate limits, real-send success/failure semantics, sanitized server errors, UUID generation, local traversal rejection and JSON-LD escaping; no real email sent.")

const guard=load(await readFile("lib/contact-guard.ts","utf8"),{"node:crypto":crypto},{process:{env:{ADMIN_SESSION_SECRET:"test-secret-".repeat(5)}}})
const time=Date.now(),token=guard.contactToken(time)
assert(!guard.validContactToken(token,time+100));assert(guard.validContactToken(token,time+2000));assert(!guard.validContactToken(token,time+7200001));assert(!guard.validContactToken(token.replace(/.$/,"z"),time+2000))
assert(contact.contactLooksAutomated({name:"xDAkjoDmGfjspcMBBFfb",subject:"cnoldInFLOGbHwulabrN",message:"AFZvFnduqFbyBjZG"}))
assert(!contact.contactLooksAutomated(valid))
console.log("PASS: contact token timing, expiry, tampering and reported spam pattern")
