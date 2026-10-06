export const SESSION_COOKIE = "techhub_session"
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24
export const isAuthConfigured = () =>
    (process.env.ADMIN_SESSION_SECRET || "").length >= 32
export const isAdminAccessOpen = () => false
export const isProductionLikeEnvironment = () =>
    process.env.NODE_ENV === "production" || Boolean(process.env.VERCEL)
async function sign(value: string) {
    if (!isAuthConfigured())
        throw new Error(
            "Set ADMIN_SESSION_SECRET to a random value of at least 32 characters."
        )
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(process.env.ADMIN_SESSION_SECRET!),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
    )
    return Buffer.from(
        await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value))
    ).toString("base64url")
}
export async function createSessionToken(id: string, version: number) {
    const payload = Buffer.from(
        JSON.stringify({
            id,
            version,
            expires: Date.now() + SESSION_MAX_AGE_SECONDS * 1000,
        })
    ).toString("base64url")
    return `${payload}.${await sign(payload)}`
}
export async function readSession(
    token?: string | null
): Promise<{ id: string; version: number; expires: number } | null> {
    if (!token || !isAuthConfigured()) return null
    try {
        const [payload, signature, extra] = token.split(".")
        if (extra || !signature) return null
        const expected = await sign(payload)
        if (expected.length !== signature.length) return null
        let diff = 0
        for (let i = 0; i < expected.length; i++)
            diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
        if (diff) return null
        const result = JSON.parse(Buffer.from(payload, "base64url").toString())
        return typeof result.id === "string" &&
            Number.isFinite(result.expires) &&
            result.expires > Date.now() &&
            Number.isInteger(result.version)
            ? result
            : null
    } catch {
        return null
    }
}
export async function verifySessionToken(token?: string | null) {
    return Boolean(await readSession(token))
}
