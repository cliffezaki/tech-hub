import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"
const source = await readFile(new URL("../lib/anonymous-analytics.ts", import.meta.url), "utf8")
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const { measurementGeography, measurementReferrer, allowMeasurement } = await import(`data:text/javascript;base64,${Buffer.from(js).toString("base64")}`)
const env = { NETLIFY: process.env.NETLIFY, VERCEL: process.env.VERCEL, AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME }
try {
    delete process.env.NETLIFY
    delete process.env.VERCEL
    delete process.env.AWS_LAMBDA_FUNCTION_NAME
    const request = headers => new Request("https://example.test/api/public/event", { headers })
    const headers = { "x-vercel-ip-country": "KE", "x-vercel-ip-country-region": "30", "x-techhub-country": "US", "x-techhub-region": "US-CA" }
    assert.deepEqual(measurementGeography(request(headers)), { country: "Unknown", region: "Unknown" })
    process.env.VERCEL = "1"
    assert.deepEqual(measurementGeography(request(headers)), { country: "KE", region: "KE-30" })
    delete process.env.VERCEL
    process.env.NETLIFY = "true"
    assert.deepEqual(measurementGeography(request(headers)), { country: "US", region: "US-CA" })
    delete process.env.NETLIFY
    process.env.AWS_LAMBDA_FUNCTION_NAME = "netlify-next-handler"
    assert.deepEqual(measurementGeography(request(headers)), { country: "US", region: "US-CA" })
    assert.deepEqual(measurementGeography(request({ "x-techhub-country": "bad", "x-techhub-region": "GPS" })), { country: "Unknown", region: "Unknown" })
    assert.equal(measurementReferrer("https://example.org/private?email=hidden#secret"), "example.org")
    assert.equal(measurementReferrer("example.org"), "example.org")
    assert.equal(measurementReferrer("javascript:alert(1)"), "Direct")
    assert.equal(measurementReferrer(null), "Direct")
    const r = request({ "x-nf-client-connection-ip": "192.0.2.1" })
    for (let i = 0; i < 150; i++) assert.equal(allowMeasurement(r, 1000), true)
    assert.equal(allowMeasurement(r, 1000), false)
    assert.equal(allowMeasurement(r, 62000), true)
    console.log("PASS: provider-specific coarse geography, spoof rejection, referrer minimization and expiring abuse limits")
} finally {
    for (const [key, value] of Object.entries(env)) value === undefined ? delete process.env[key] : process.env[key] = value
}
const edgeSource = await readFile(new URL("../netlify/edge-functions/analytics-geography.js", import.meta.url), "utf8")
const { default: edge } = await import(`data:text/javascript;base64,${Buffer.from(edgeSource).toString("base64")}`)
const forged = new Request("https://example.test/api/public/event", { method: "POST", body: "{}", headers: { "x-techhub-country": "FAKE", "x-techhub-region": "FAKE", "x-techhub-region-name": "FAKE" } })
await edge(forged, { geo: { country: { code: "KE" }, subdivision: { code: "30", name: "Nairobi County" } }, next: async request => {
    assert.equal(request.headers.get("x-techhub-country"), "KE")
    assert.equal(request.headers.get("x-techhub-region"), "30")
    assert.equal(request.headers.get("x-techhub-region-name"), "Nairobi County")
    assert.equal(await request.text(), "{}")
    return new Response("ok")
} })
console.log("PASS: Netlify edge overwrites forged geography and preserves request body")
