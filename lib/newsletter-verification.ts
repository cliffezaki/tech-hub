import "server-only"
import { randomBytes } from "node:crypto"
import { emailId } from "@/lib/accounts"
import { claim, getRecord, saveRecord, replaceRecord, deleteRecord } from "@/lib/platform-store"
import { sendNewsletterVerification, verifyEmailDelivery } from "@/lib/email"
import { resetConfigured } from "@/lib/password-reset"
type Subscription = { recordVersion?: number; id: string; email: string; active?: boolean; [key: string]: unknown }
type Pending = { email: string; expiresAt: number; existed: boolean; recordVersion?: number }
export async function requestNewsletter(email: string) {
    if (!resetConfigured()) throw new Error("Newsletter email verification is not configured. Please try later.")
    await verifyEmailDelivery()
    const current = await getRecord<Subscription>("subscriptions", emailId(email))
    if (current && current.active !== false) return
    const token = randomBytes(32).toString("hex"), id = emailId(token)
    await saveRecord("newsletter-verifications", id, { email, expiresAt: Date.now() + 30 * 60000, existed: !!current, recordVersion: current?.recordVersion }, true)
    const url = new URL("/account", process.env.NEXT_PUBLIC_SITE_URL); url.hash = `newsletter=${token}`
    try { await sendNewsletterVerification(email, url, id) } catch { console.error("Newsletter verification delivery failed. Check provider delivery logs.") }
}
export async function verifyNewsletter(token: string) {
    if (!/^[a-f0-9]{64}$/.test(token)) throw Error("Invalid confirmation link.")
    const key = emailId(token), pending = await getRecord<Pending>("newsletter-verifications", key)
    if (!pending || pending.expiresAt <= Date.now()) throw Error("This confirmation link expired. Please subscribe again.")
    const id = emailId(pending.email), current = await getRecord<Subscription>("subscriptions", id)
    const value: Subscription = { ...current, id, email: pending.email, active: true, consent: true, source: "newsletter", verifiedAt: new Date().toISOString(), updatedAt: new Date().toISOString(), name: current?.name || "Newsletter reader" }
    if (!pending.existed) await claim("subscriptions", id, { ...value, createdAt: new Date().toISOString(), recordVersion: 1 })
    else {
        if (!current || current.recordVersion !== pending.recordVersion) throw Error("Your preference changed. Please request a new confirmation link.")
        await replaceRecord("subscriptions", id, current, value)
    }
    await deleteRecord("newsletter-verifications", key)
}
