import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { createRequire } from "node:module"
import vm from "node:vm"
import ts from "typescript"

const requireNode = createRequire(import.meta.url)
function load(source, env, imports = {}) {
    const exports = {}
    vm.runInNewContext(ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
    }).outputText, {
        exports, Buffer, process: { env, cwd: () => "/isolated-hosting-test" },
        require: name => {
            if (name === "server-only") return {}
            if (name in imports) return imports[name]
            if (name.startsWith("node:")) return requireNode(name)
            throw new Error(`Unexpected import: ${name}`)
        },
    })
    return exports
}

const siteSource = await readFile("lib/site.ts", "utf8")
assert.equal(load(siteSource, {}).getSiteUrl(), "http://localhost:3000")
assert.equal(load(siteSource, { URL: "https://live.netlify.app/" }).getSiteUrl(), "https://live.netlify.app")
assert.equal(load(siteSource, { URL: "https://live.netlify.app", DEPLOY_PRIME_URL: "https://preview.netlify.app/" }).getSiteUrl(), "https://preview.netlify.app")
assert.equal(load(siteSource, { NEXT_PUBLIC_SITE_URL: "https://mytechhub.online/", URL: "https://live.netlify.app" }).getSiteUrl(), "https://mytechhub.online")
assert.equal(load(siteSource, { VERCEL_PROJECT_PRODUCTION_URL: "live.vercel.app" }).getSiteUrl(), "https://live.vercel.app")

const authSource = await readFile("lib/auth.ts", "utf8")
assert.equal(load(authSource, { NODE_ENV: "development" }).isProductionLikeEnvironment(), false)
for (const env of [{ NODE_ENV: "production" }, { NETLIFY: "true" }, { VERCEL: "1" }, { AWS_LAMBDA_FUNCTION_NAME: "function" }]) {
    assert.equal(load(authSource, env).isProductionLikeEnvironment(), true)
}

const platformSource = await readFile("lib/platform-store.ts", "utf8")
const storage = { "@/lib/supabase-store": { supabaseConfigured: () => false, supabaseAttempted: () => false } }
assert.equal(load(platformSource, { NODE_ENV: "development" }, storage).platformReady(), true)
for (const env of [{ NODE_ENV: "production" }, { NETLIFY: "true" }, { VERCEL: "1" }, { AWS_LAMBDA_FUNCTION_NAME: "function" }]) {
    const platform = load(platformSource, env, storage)
    assert.equal(platform.platformReady(), false)
    await assert.rejects(platform.saveRecord("users", "test", {}), /Private CMS storage is not configured/)
}
const remote = { "@/lib/supabase-store": { supabaseConfigured: () => true, supabaseAttempted: () => true } }
assert.equal(load(platformSource, { NETLIFY: "true", NODE_ENV: "production" }, remote).platformReady(), true)

const demoSource = await readFile("lib/demo-seed.ts", "utf8")
const demoImports = { "@/lib/store/normalize": {}, "@/lib/demo-artwork": {}, "@/lib/demo-content": {} }
assert.equal(load(demoSource, { NETLIFY: "true", VERCEL_ENV: "preview", NEXT_PUBLIC_SANITY_PROJECT_ID: "test", NEXT_PUBLIC_SANITY_DATASET: "staging" }, demoImports).demoSeedEnabled(), false)
console.log("PASS: canonical deployment URLs, hosted session security, fail-closed private storage and disabled live demo import.")
