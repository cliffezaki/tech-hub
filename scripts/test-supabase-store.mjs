import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import ts from "typescript"
import { createRequire } from "node:module"

const require = createRequire(import.meta.url)
const { unstable_rethrow } = require("next/navigation")
const {
    DynamicServerError,
} = require("next/dist/client/components/hooks-server-context")

const env = {
    SUPABASE_URL: "https://test-project.supabase.co",
    SUPABASE_SECRET_KEY: "sb_secret_fake_for_tests",
    NODE_ENV: "production",
}
const records = new Map()
const calls = []
let error = null
let networkFailure = false
let frameworkFailure = null
function loadModule(filename, imports, extra = {}) {
    const exports = {}
    const source = ts.transpileModule(filename, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2022,
            esModuleInterop: true,
        },
    }).outputText
    vm.runInNewContext(source, {
        exports,
        URL,
        URLSearchParams,
        AbortSignal,
        process: { env, cwd: () => "/unused-test" },
        require: (name) => {
            if (name === "server-only") return {}
            if (name in imports) return imports[name]
            throw new Error(`Unexpected import: ${name}`)
        },
        ...extra,
    })
    return exports
}
const adapter = loadModule(
    await readFile("lib/supabase-store.ts", "utf8"),
    { "next/navigation": { unstable_rethrow } },
    {
        fetch: async (url, options) => {
            calls.push({ url: String(url), options })
            assert.equal(options.headers.apikey, env.SUPABASE_SECRET_KEY)
            assert.equal(options.headers.Authorization, undefined)
            assert.equal(options.cache, "no-store")
            assert.equal(options.redirect, "error")
            if (frameworkFailure) throw frameworkFailure
            if (networkFailure) throw new Error("provider contained a secret")
            if (error)
                return Response.json(error.body, { status: error.status })
            const query = new URL(url).searchParams
            const collection = query.get("collection")?.slice(3)
            const id = query.get("id")?.slice(3)
            if (options.method === "POST") {
                const record = JSON.parse(options.body)
                const key = `${record.collection}:${record.id}`
                if (records.has(key) && !query.has("on_conflict"))
                    return Response.json(
                        { code: "23505", details: "private row contents" },
                        { status: 409 }
                    )
                records.set(key, record)
                return new Response(null, { status: 201 })
            }
            if (options.method === "DELETE") {
                records.delete(`${collection}:${id}`)
                return new Response(null, { status: 204 })
            }
            const matched = [...records.values()]
                .filter(
                    (record) =>
                        record.collection === collection &&
                        (!id || record.id === id)
                )
                .sort((a, b) => a.id.localeCompare(b.id))
            const offset = Number(query.get("offset") || 0)
            // Simulate a database API configured to cap responses below the requested page size.
            return Response.json(
                matched
                    .slice(
                        offset,
                        offset + Math.min(2, Number(query.get("limit")))
                    )
                    .map((record) => ({ payload: record.payload }))
            )
        },
    }
)
let localReads = 0
const platform = loadModule(await readFile("lib/platform-store.ts", "utf8"), {
    "@/lib/supabase-store": adapter,
    "node:fs/promises": {
        readFile: () => {
            localReads++
            throw new Error("Unexpected local fallback")
        },
    },
    "node:path": { join: (...values) => values.join("/") },
    "node:crypto": { randomUUID: () => "unused" },
})
assert.equal(platform.platformReady(), true)
await platform.saveRecord("users", "one", { name: "First" }, true)
await platform.saveRecord("users", "one", { name: "Updated" })
assert.equal((await platform.getRecord("users", "one")).name, "Updated")
assert.equal(await platform.getRecord("users", "missing"), null)
for (let i = 2; i <= 7; i++)
    await platform.saveRecord("users", `record-${i}`, { number: i }, true)
await platform.saveRecord("inquiries", "one", { message: "private" }, true)
assert.equal((await platform.listRecords("users")).length, 7)
assert.equal((await platform.listRecords("inquiries")).length, 1)
assert.equal(await platform.claim("locks", "campaigns", {}), true)
assert.equal(await platform.claim("locks", "campaigns", {}), false)
await platform.deleteRecord("locks", "campaigns")
assert.equal(await platform.claim("locks", "campaigns", {}), true)
const outcomes = await Promise.all([
    platform.claim("password-reset-used", "same-version", {}),
    platform.claim("password-reset-used", "same-version", {}),
])
assert.equal(outcomes.filter(Boolean).length, 1)
const before = calls.length
await assert.rejects(
    platform.getRecord("users", "one&collection=eq.inquiries"),
    /Invalid record identifier/
)
assert.equal(calls.length, before)
error = {
    status: 403,
    body: { message: "private row contents and credentials" },
}
await assert.rejects(
    platform.listRecords("users"),
    (message) => !message.message.includes("private row contents")
)
error = { status: 409, body: { code: "23503", details: "another constraint" } }
await assert.rejects(platform.claim("locks", "other", {}), /request failed/)
error = null
networkFailure = true
await assert.rejects(
    platform.getRecord("users", "one"),
    /temporarily unavailable/
)
networkFailure = false
frameworkFailure = new DynamicServerError("cache: no-store")
await assert.rejects(
    platform.getRecord("users", "one"),
    (failure) => failure === frameworkFailure
)
frameworkFailure = null
env.SUPABASE_SECRET_KEY = "sb_publishable_not_privileged"
assert.equal(platform.platformReady(), false)
env.NODE_ENV = "development"
assert.equal(platform.platformReady(), false)
await assert.rejects(platform.getRecord("users", "one"), /not configured/)
env.SUPABASE_SECRET_KEY = "sb_secret_fake_for_tests"
env.SUPABASE_URL = "https://attacker.example"
assert.equal(platform.platformReady(), false)
await assert.rejects(platform.listRecords("users"), /not configured/)
env.SUPABASE_URL = ""
env.SUPABASE_SECRET_KEY = ""
assert.equal(platform.platformReady(), true)
env.NODE_ENV = "production"
assert.equal(platform.platformReady(), false)
assert.equal(localReads, 0)
console.log(
    "PASS: Supabase CRUD, paginated records, collection isolation, duplicate/concurrent claims, sanitized failures, secret-key headers, safe endpoints, and no local fallback after database failure."
)
