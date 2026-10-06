import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createHash, randomBytes } from "node:crypto"
import vm from "node:vm"
import ts from "typescript"

// Load the actual server module with isolated storage and network adapters. No email is sent.
const source = await readFile("lib/password-reset.ts", "utf8")
const code = ts.transpileModule(source, {
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
    },
}).outputText
const records = new Map()
const digest = (value) => createHash("sha256").update(value).digest("hex")
const user = {
    id: digest("reader@example.test"),
    email: "reader@example.test",
    status: "active",
    sessionVersion: 1,
}
records.set(`users:${user.id}`, user)
let sent = []
let fail = false
let logs = []
const env = {
    RESEND_API_KEY: "test-key",
    RESEND_FROM_EMAIL: "Tech Hub <reset@example.test>",
    NEXT_PUBLIC_SITE_URL: "https://example.test",
}
const context = {
    exports: {},
    URL,
    Date,
    AbortSignal,
    process: { env },
    console: { error: (message) => logs.push(message) },
    fetch: async (url, options) => {
        sent.push({ url, options })
        return { ok: !fail }
    },
    require: (name) => {
        if (name === "server-only") return {}
        if (name === "node:crypto") return { randomBytes }
        if (name === "@/lib/accounts")
            return { emailId: digest, hashPassword: async () => "hash" }
        if (name === "@/lib/platform-store")
            return {
                getRecord: async (collection, id) =>
                    records.get(`${collection}:${id}`),
                saveRecord: async (collection, id, value) =>
                    records.set(`${collection}:${id}`, value),
                claim: async (collection, id, value) => {
                    const key = `${collection}:${id}`
                    if (records.has(key)) return false
                    records.set(key, value)
                    return true
                },
            }
        throw new Error(`Unexpected import: ${name}`)
    },
}
vm.runInNewContext(code, context)
const api = context.exports
assert.equal(api.resetConfigured(), true)
env.NEXT_PUBLIC_SITE_URL = "http://example.test"
assert.equal(api.resetConfigured(), false)
env.NEXT_PUBLIC_SITE_URL = "https://example.test"
await api.requestReset("absent@example.test")
assert.equal(sent.length, 0)
await api.requestReset(user.email)
assert.equal(sent.length, 1)
assert.equal(sent[0].url, "https://api.resend.com/emails")
const payload = JSON.parse(sent[0].options.body)
assert.deepEqual(payload.to, [user.email])
const token = payload.text.match(/#reset=([a-f0-9]{64})/)[1]
const saved = records.get(`password-resets:${digest(token)}`)
assert.equal(saved.userId, user.id)
assert(saved.expiresAt > Date.now() + 29 * 60000)
assert(!JSON.stringify([...records]).includes(token))
assert(!sent[0].options.headers["Idempotency-Key"].includes(token))
const attempts = await Promise.allSettled([
    api.redeemReset(token, "password"),
    api.redeemReset(token, "password"),
])
assert.equal(
    attempts.filter((result) => result.status === "fulfilled").length,
    1
)
fail = true
await api.requestReset(user.email)
assert.equal(logs.length, 1)
assert(!logs[0].includes(user.email))
assert(!logs[0].includes(token))
console.log(
    "PASS: mocked Resend payload, private hashed token, canonical HTTPS URL, unknown address, concurrent redemption, and sanitized delivery failure checks; no real email sent."
)
