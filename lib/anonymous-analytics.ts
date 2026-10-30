import { createHmac, randomBytes } from "node:crypto"

const salt = randomBytes(32)
const limits = new Map<string, { count: number; until: number }>()
// Abuse protection only. These short-lived keys never enter the analytics database.
export function allowMeasurement(request: Request, now = Date.now()) {
    for (const [key, value] of limits) if (value.until <= now) limits.delete(key)
    const ip = request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "local"
    const key = createHmac("sha256", salt).update(ip.slice(0, 200)).digest("hex")
    const value = limits.get(key)
    if (value) return ++value.count <= 150
    if (limits.size >= 10000) return false
    limits.set(key, { count: 1, until: now + 60000 })
    return true
}
export function measurementGeography(request: Request) {
    // Read only hosting-provided coarse geography. Never use client payload location.
    // NETLIFY is a build-time flag and may be absent in the serverless runtime.
    // The live Netlify Next.js handler runs in AWS Lambda; Vercel takes precedence.
    const netlify = process.env.VERCEL !== "1" && (
        process.env.NETLIFY === "true" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
    )
    if (!netlify && process.env.VERCEL !== "1") return { country: "Unknown", region: "Unknown" }
    const country = request.headers.get(netlify ? "x-techhub-country" : "x-vercel-ip-country") || ""
    const region = request.headers.get(netlify ? "x-techhub-region" : "x-vercel-ip-country-region") || ""
    if (!/^[A-Z]{2}$/.test(country)) return { country: "Unknown", region: "Unknown" }
    const subdivision = region.startsWith(`${country}-`) ? region.slice(3) : region
    const name = netlify ? request.headers.get("x-techhub-region-name") || "" : ""
    const regionLabel = /^[\p{L}\p{N} .'()-]{1,80}$/u.test(name) ? `${country} / ${name}` : `${country}-${subdivision}`
    return { country, region: /^[A-Z0-9]{1,3}$/.test(subdivision) ? regionLabel : "Unknown" }
}
export function measurementReferrer(value: unknown) {
    if (typeof value !== "string" || !value) return "Direct"
    try {
        const url = new URL(value.includes("://") ? value : `https://${value}`)
        return /^https?:$/.test(url.protocol) ? url.hostname.slice(0, 253) : "Direct"
    } catch { return "Direct" }
}
