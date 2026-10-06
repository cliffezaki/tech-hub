import "server-only"
import nodemailer from "nodemailer"

export class EmailDeliveryUnavailable extends Error {
    constructor() {
        super("Password-reset email delivery is temporarily unavailable. Please try again later or contact the site owner.")
    }
}

function gmailCredentials() {
    const user = (process.env.SMTP_USER || "").trim().toLowerCase()
    // Google displays app passwords in groups separated by spaces.
    const pass = (process.env.SMTP_PASSWORD || "").replace(/ /g, "")
    if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(user) || !/^[a-zA-Z0-9]{16}$/.test(pass))
        return null
    return { user, pass }
}

export function emailDeliveryConfigured() {
    const provider = process.env.MAIL_PROVIDER || "resend"
    if (provider === "gmail") return Boolean(gmailCredentials())
    if (provider !== "resend") return false
    return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
}

function gmailTransport() {
    const auth = gmailCredentials()
    if (!auth) throw new EmailDeliveryUnavailable()
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth,
        tls: { minVersion: "TLSv1.2", rejectUnauthorized: true },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 15000,
        dnsTimeout: 10000,
        logger: false,
        debug: false,
        disableFileAccess: true,
        disableUrlAccess: true,
    })
}

export async function verifyEmailDelivery() {
    if (!emailDeliveryConfigured()) throw new EmailDeliveryUnavailable()
    if (process.env.MAIL_PROVIDER !== "gmail") return
    try {
        // Check credentials for every address, including unknown accounts, so a
        // broken sender produces the same error without revealing membership.
        await gmailTransport().verify()
    } catch {
        throw new EmailDeliveryUnavailable()
    }
}

export async function sendResetEmail(to: string, resetUrl: URL, requestId: string) {
    if (!emailDeliveryConfigured()) throw new EmailDeliveryUnavailable()
    const subject = "Reset your Tech Hub password"
    const text = `Use this link to reset your Tech Hub password within 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, ignore this email. Your password has not changed.`
    try {
        if (process.env.MAIL_PROVIDER === "gmail") {
            const auth = gmailCredentials()!
            const result = await gmailTransport().sendMail({
                from: { name: "Tech Hub", address: auth.user },
                to: { address: to, name: "" },
                subject,
                text,
            })
            if (!result.accepted?.some((recipient) => String(recipient).toLowerCase() === to.toLowerCase()))
                throw new EmailDeliveryUnavailable()
            return
        }
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `password-reset-${requestId}`,
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL,
                to: [to],
                subject,
                text,
            }),
            signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) throw new EmailDeliveryUnavailable()
    } catch {
        // Provider exceptions can contain recipient addresses or SMTP credentials.
        throw new EmailDeliveryUnavailable()
    }
}
