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
const sent = []
const smtpSent = []
const transports = []
let smtpChecks = 0
let smtpFailure = false
let fail = false
let logs = []
const env = {
    RESEND_API_KEY: "test-key",
    RESEND_FROM_EMAIL: "Tech Hub <reset@example.test>",
    NEXT_PUBLIC_SITE_URL: "https://example.test",
}
const emailContext = {
    exports: {}, URL, AbortSignal, process: { env },
    fetch: async (url, options) => {
        sent.push({ url, options })
        return { ok: !fail }
    },
    require: (name) => {
        if (name === "server-only") return {}
        if (name === "nodemailer") return {
            default: {
                createTransport: (options) => {
                    transports.push(options)
                    return {
                        verify: async () => {
                            smtpChecks++
                            if (smtpFailure) throw new Error("secret credentials and recipient")
                            return true
                        },
                        sendMail: async (message) => {
                            smtpSent.push(message)
                            if (fail) throw new Error("secret credentials and recipient")
                            return { accepted: [message.to.address] }
                        },
                    }
                },
            },
        }
        throw new Error(`Unexpected email import: ${name}`)
    },
}
vm.runInNewContext(ts.transpileModule(await readFile("lib/email.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, emailContext)
const context = {
    exports: {},
    URL,
    Date,
    AbortSignal,
    process: { env },
    console: { error: (message) => logs.push(message) },
    require: (name) => {
        if (name === "server-only") return {}
        if (name === "node:crypto") return { randomBytes }
        if (name === "@/lib/email") return emailContext.exports
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
fail = false
env.MAIL_PROVIDER = "invalid"
assert.equal(api.resetConfigured(), false)
env.MAIL_PROVIDER = "gmail"
assert.equal(api.resetConfigured(), false)
env.SMTP_USER = "Tech.Hub.Test@gmail.com"
env.SMTP_PASSWORD = "abcd efgh ijkl mnop"
assert.equal(api.resetConfigured(), true)
env.SMTP_USER = "not-gmail@example.test"
assert.equal(api.resetConfigured(), false)
env.SMTP_USER = "Tech.Hub.Test@gmail.com"
const beforeUnknown = smtpChecks
await api.requestReset("absent@example.test")
assert.equal(smtpChecks, beforeUnknown + 1)
assert.equal(smtpSent.length, 0)
await api.requestReset(user.email)
assert.equal(smtpSent.length, 1)
const smtpPayload = smtpSent[0]
assert.equal(smtpPayload.from.address, "tech.hub.test@gmail.com")
assert.equal(smtpPayload.from.name, "Tech Hub")
assert.equal(smtpPayload.to.address, user.email)
assert.match(smtpPayload.text, /https:\/\/example.test\/account#reset=[a-f0-9]{64}/)
assert(!smtpPayload.text.includes(env.SMTP_PASSWORD))
assert(transports.every((options) =>
    options.host === "smtp.gmail.com" && options.port === 465 && options.secure === true &&
    options.tls.rejectUnauthorized === true && options.logger === false && options.debug === false &&
    options.disableFileAccess === true && options.disableUrlAccess === true
))
assert.equal(transports.at(-1).auth.pass, "abcdefghijklmnop")
smtpFailure = true
const recordsBeforeFailure = records.size
for (const email of [user.email, "absent@example.test"]) {
    await assert.rejects(api.requestReset(email), (error) =>
        error instanceof emailContext.exports.EmailDeliveryUnavailable &&
        !error.message.includes("secret credentials") && !error.message.includes(email)
    )
}
assert.equal(records.size, recordsBeforeFailure)
smtpFailure = false
fail = true
await api.requestReset(user.email)
assert.equal(logs.length, 2)
assert(!logs.at(-1).includes("secret credentials"))
assert(!logs.at(-1).includes(user.email))
console.log(
    "PASS: mocked Gmail TLS delivery and credential checks, Resend compatibility, private hashed tokens, canonical HTTPS URL, unknown-address privacy, concurrent redemption, and sanitized provider failures; no real email sent."
)
