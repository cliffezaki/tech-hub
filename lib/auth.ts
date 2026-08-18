/**
 * Password-based admin sessions.
 *
 * Deliberately small: one shared password in an environment variable, and a signed
 * cookie proving it was entered. No user table to provision, and it works identically
 * on a laptop and on serverless hosting. Uses Web Crypto so the same code can run in
 * middleware (edge runtime) and in route handlers (node runtime).
 */

export const SESSION_COOKIE = "techhub_session"

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000

export function getAdminPassword() {
    return process.env.ADMIN_PASSWORD || ""
}

export function isAuthConfigured() {
    return getAdminPassword().length > 0
}

/**
 * With no password configured, editing is allowed on a local machine (so `npm run dev`
 * needs no setup) but refused anywhere that looks like a real deployment.
 */
export function isProductionLikeEnvironment() {
    return process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL)
}

export function isAdminAccessOpen() {
    return !isAuthConfigured() && !isProductionLikeEnvironment()
}

function getSecret() {
    return process.env.ADMIN_SESSION_SECRET || getAdminPassword()
}

function toBase64Url(bytes: ArrayBuffer) {
    let binary = ""
    for (const byte of new Uint8Array(bytes)) {
        binary += String.fromCharCode(byte)
    }

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

async function sign(value: string, secret: string) {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )

    return toBase64Url(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)))
}

function timingSafeEqual(a: string, b: string) {
    if (a.length !== b.length) {
        return false
    }

    let mismatch = 0
    for (let index = 0; index < a.length; index += 1) {
        mismatch |= a.charCodeAt(index) ^ b.charCodeAt(index)
    }

    return mismatch === 0
}

export function verifyPassword(candidate: string) {
    const password = getAdminPassword()
    return password.length > 0 && timingSafeEqual(candidate, password)
}

export async function createSessionToken() {
    const expiresAt = String(Date.now() + SESSION_DURATION_MS)
    return `${expiresAt}.${await sign(expiresAt, getSecret())}`
}

export async function verifySessionToken(token: string | undefined | null) {
    if (!token) {
        return false
    }

    const [expiresAt, signature] = token.split(".")
    if (!expiresAt || !signature) {
        return false
    }

    if (Number(expiresAt) < Date.now()) {
        return false
    }

    const secret = getSecret()
    if (!secret) {
        return false
    }

    return timingSafeEqual(signature, await sign(expiresAt, secret))
}

export const SESSION_MAX_AGE_SECONDS = SESSION_DURATION_MS / 1000
