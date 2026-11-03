import "server-only"
import { randomBytes, randomInt, createHmac, timingSafeEqual } from "node:crypto"
import { emailId, throttle } from "@/lib/accounts"
import { claim, getRecord, saveRecord, deleteRecord } from "@/lib/platform-store"
import { sendVerificationEmail, verifyEmailDelivery } from "@/lib/email"
import { resetConfigured } from "@/lib/password-reset"
import type { User } from "@/lib/permissions"

interface PendingAccount { user: User; expiresAt: number; codeHash?: string; createdAt?: number }
const lifetime = 30 * 60 * 1000
function codeDigest(id: string, code: string) {
    const secret = process.env.ADMIN_SESSION_SECRET
    if (!secret || secret.length < 32) throw new Error("Verification is unavailable.")
    return createHmac("sha256", secret).update(`registration:${id}:${code}`).digest("hex")
}
function receipt(id: string, expiresAt: number) {
    return { challenge: id, expiresAt, resendAt: Date.now() + 60000 }
}
export async function requestVerification(user: User) {
    if (!resetConfigured()) throw new Error("Email verification is not configured. Please try registration later.")
    // Always validate the submitted password and mail service before checking membership.
    if (await getRecord<User>("users", user.id)) { await verifyEmailDelivery(); return receipt(randomBytes(32).toString("hex"), Date.now() + lifetime) }
    const token = randomBytes(32).toString("hex")
    const id = emailId(token)
    const code = randomInt(0, 1000000).toString().padStart(6, "0")
    const expiresAt = Date.now() + lifetime
    await saveRecord("pending-accounts", id, { user, expiresAt, createdAt: Date.now(), codeHash: codeDigest(id, code) }, true)
    const url = new URL("/account", process.env.NEXT_PUBLIC_SITE_URL)
    url.hash = `verify=${token}`
    try { await sendVerificationEmail(user.email, url, id, code) }
    catch { await deleteRecord("pending-accounts", id); throw new Error("We could not send your verification email. Please try again shortly. Your account has not been activated.") }
    return receipt(id, expiresAt)
}
export async function verifyAccount(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw new Error("Invalid verification link.")
    const id = emailId(token)
    const pending = await getRecord<PendingAccount>("pending-accounts", id)
    if (!pending || pending.expiresAt <= Date.now()) throw new Error("This link expired. Sign up again to request a new one.")
    const user = { ...pending.user, emailVerifiedAt: new Date().toISOString() }
    // Unique insert prevents a token from changing an existing account, role or password.
    await claim("users", user.id, user)
    await deleteRecord("pending-accounts", id)
}

export async function verifyAccountCode(id: string, code: string) {
    if (!/^[a-f0-9]{64}$/.test(id) || !/^\d{6}$/.test(code)) throw new Error("Enter the six-digit code from your email.")
    const pending = await getRecord<PendingAccount>("pending-accounts", id)
    if (!pending || !pending.codeHash || pending.expiresAt <= Date.now()) throw new Error("This code expired or was already used. Sign in if you confirmed by email, or sign up again.")
    // Atomic slots enforce five attempts across concurrent requests, not just this browser.
    let allowed = false
    for (let i = 0; i < 5; i++) {
        if (await claim("limits", `verification-${id}-${i}`, { expiresAt: pending.expiresAt })) { allowed = true; break }
    }
    if (!allowed || !await throttle(`verification-code:${pending.user.id}`, 10)) throw Object.assign(new Error("Too many code attempts. Use your email link or try again later."), { status: 429 })
    if (!timingSafeEqual(Buffer.from(pending.codeHash, "hex"), Buffer.from(codeDigest(id, code), "hex"))) throw new Error("That code is incorrect. Check your email and try again.")
    await claim("users", pending.user.id, { ...pending.user, emailVerifiedAt: new Date().toISOString() })
    await deleteRecord("pending-accounts", id)
}
export async function resendVerification(id: string) {
    if (!/^[a-f0-9]{64}$/.test(id)) throw new Error("Start registration again to request a code.")
    const pending = await getRecord<PendingAccount>("pending-accounts", id)
    // Unknown challenges receive the same shape, without exposing account membership.
    if (!pending) return receipt(randomBytes(32).toString("hex"), Date.now() + lifetime)
    if (pending.expiresAt <= Date.now()) throw new Error("Registration expired. Please sign up again.")
    if (Date.now() < (pending.createdAt || 0) + 60000 || !await claim("limits", `verification-resend-${id}`, { expiresAt: pending.expiresAt })) throw Object.assign(new Error("Please wait before requesting another email."), { status: 429 })
    if (!await throttle(`verification-resend:${pending.user.id}`, 3)) throw Object.assign(new Error("Too many email requests. Try again in 15 minutes."), { status: 429 })
    try { return await requestVerification(pending.user) }
    catch (error) { await deleteRecord("limits", `verification-resend-${id}`); throw error }
}
