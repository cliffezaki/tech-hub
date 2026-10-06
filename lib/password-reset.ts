import "server-only"
import { randomBytes } from "node:crypto"
import { emailId, hashPassword } from "@/lib/accounts"
import { claim, getRecord, saveRecord } from "@/lib/platform-store"
import type { User } from "@/lib/permissions"

interface ResetRecord {
    userId: string
    sessionVersion: number
    expiresAt: number
}
export function resetConfigured() {
    try {
        const url = new URL(process.env.NEXT_PUBLIC_SITE_URL || "")
        return Boolean(
            process.env.RESEND_API_KEY &&
            process.env.RESEND_FROM_EMAIL &&
            url.protocol === "https:" &&
            !url.username &&
            !url.password
        )
    } catch {
        return false
    }
}
export async function requestReset(email: string) {
    const user = await getRecord<User>("users", emailId(email))
    if (!user || user.status !== "active") return
    const token = randomBytes(32).toString("hex")
    const id = emailId(token)
    const record: ResetRecord = {
        userId: user.id,
        sessionVersion: user.sessionVersion,
        expiresAt: Date.now() + 30 * 60 * 1000,
    }
    await saveRecord("password-resets", id, record, true)
    const url = new URL("/account", process.env.NEXT_PUBLIC_SITE_URL)
    url.hash = `reset=${token}`
    try {
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `password-reset-${id}`,
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL,
                to: [user.email],
                subject: "Reset your Tech Hub password",
                text: `Use this link to reset your Tech Hub password within 30 minutes:\n\n${url}\n\nIf you did not request this, ignore this email. Your password has not changed.`,
            }),
            signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) throw new Error("Email provider rejected request")
    } catch {
        // Never log the recipient, token, provider response, or credentials.
        console.error(
            "Password-reset email delivery failed. Check Resend configuration and delivery logs."
        )
    }
}
export async function redeemReset(token: string, password: string) {
    const invalid = () =>
        new Error("This reset link is invalid or expired. Request a new one.")
    if (!/^[a-f0-9]{64}$/.test(token)) throw invalid()
    const id = emailId(token)
    const record = await getRecord<ResetRecord>("password-resets", id)
    if (!record || record.expiresAt <= Date.now()) throw invalid()
    const user = await getRecord<User>("users", record.userId)
    if (
        !user ||
        user.status !== "active" ||
        user.sessionVersion !== record.sessionVersion
    )
        throw invalid()
    const passwordHash = await hashPassword(password)
    // One atomic claim per account/version prevents reuse and parallel redemption of sibling links.
    if (
        !(await claim(
            "password-reset-used",
            `${user.id}-${record.sessionVersion}`,
            { expiresAt: record.expiresAt }
        ))
    )
        throw invalid()
    const latest = await getRecord<User>("users", user.id)
    if (
        !latest ||
        latest.status !== "active" ||
        latest.sessionVersion !== record.sessionVersion ||
        record.expiresAt <= Date.now()
    )
        throw invalid()
    await saveRecord("users", user.id, {
        ...latest,
        passwordHash,
        sessionVersion: latest.sessionVersion + 1,
    })
}
