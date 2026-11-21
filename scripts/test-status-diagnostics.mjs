import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import ts from "typescript"

const source = await readFile("app/api/status/route.ts", "utf8")
let settingsAuthorized = false
let authConfigured = true
let storageReady = true
let authorizationChecks = 0
const context = {
    exports: {},
    require(name) {
        if (name === "next/server") return { NextResponse: { json: (body, init) => ({ body, init }) } }
        if (name === "@/lib/auth") return { isAdminAccessOpen: () => false, isAuthConfigured: () => authConfigured }
        if (name === "@/lib/store") return { getStoreStatus: () => ({ canWrite: true }) }
        if (name === "@/lib/platform-store") return { platformReady: () => storageReady }
        if (name === "@/lib/accounts") return { authorized: async permission => {
            assert.equal(permission, "settings.manage")
            authorizationChecks++
            return settingsAuthorized ? { id: "owner-test" } : null
        } }
        if (name === "@/lib/password-reset") return {
            resetConfigured: () => false,
            resetConfigurationIssues: () => ["SMTP_PASSWORD_INVALID"],
        }
        throw new Error(`Unexpected import: ${name}`)
    },
}
vm.runInNewContext(ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, context)

for (const allowed of [false, true]) {
    settingsAuthorized = allowed
    const result = await context.exports.GET()
    assert.equal("passwordResetConfigurationIssues" in result.body, allowed)
    assert.equal(result.init.headers["Cache-Control"], "no-store")
    assert.equal(result.init.headers.Vary, "Cookie")
    if (allowed) {
        assert.deepEqual(Array.from(result.body.passwordResetConfigurationIssues), ["SMTP_PASSWORD_INVALID"])
        assert.equal(result.body.passwordResetConfigured, false)
    }
}
const checksBefore = authorizationChecks
authConfigured = false
assert.equal("passwordResetConfigurationIssues" in (await context.exports.GET()).body, false)
authConfigured = true
storageReady = false
assert.equal("passwordResetConfigurationIssues" in (await context.exports.GET()).body, false)
assert.equal(authorizationChecks, checksBefore)
console.log("PASS: configuration issue codes require settings permission and are never cached or available with incomplete account storage.")
