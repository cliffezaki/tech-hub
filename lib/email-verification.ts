import "server-only"
import { randomBytes } from "node:crypto"
import { emailId } from "@/lib/accounts"
import { claim, getRecord, saveRecord, deleteRecord } from "@/lib/platform-store"
import { sendVerificationEmail, verifyEmailDelivery } from "@/lib/email"
import { resetConfigured } from "@/lib/password-reset"
import type { User } from "@/lib/permissions"

interface PendingAccount { user: User; expiresAt: number }
export async function requestVerification(user: User) {
    if (!resetConfigured()) throw new Error("Email verification is not configured. Please try registration later.")
    await verifyEmailDelivery()
    // Always validate the submitted password and mail service before checking membership.
    if (await getRecord<User>("users", user.id)) return
    const token = randomBytes(32).toString("hex")
    const id = emailId(token)
    await saveRecord("pending-accounts", id, { user, expiresAt: Date.now() + 30 * 60 * 1000 }, true)
    const url = new URL("/account", process.env.NEXT_PUBLIC_SITE_URL)
    url.hash = `verify=${token}`
    try { await sendVerificationEmail(user.email, url, id) }
    catch { console.error("Account verification email delivery failed. Check provider delivery logs.") }
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
