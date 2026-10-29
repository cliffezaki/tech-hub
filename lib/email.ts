import "server-only"
import nodemailer from "nodemailer"

export class EmailDeliveryUnavailable extends Error {
    constructor(context: "reset" | "contact" = "reset") {
        super(context === "contact"
            ? "Your message could not be sent right now. Please try again later or use the email address on this page."
            : "Password-reset email delivery is temporarily unavailable. Please try again later or contact the site owner.")
    }
}

function mailProvider() {
    return (process.env.MAIL_PROVIDER || "resend").trim().toLowerCase()
}

function gmailValues() {
    const user = (process.env.SMTP_USER || "").trim().toLowerCase()
    // Google's grouped display and clipboard can contain non-breaking spaces
    // or line breaks. Only whitespace is removed; the actual key stays strict.
    const pass = (process.env.SMTP_PASSWORD || "").replace(/\s/g, "")
    return { user, pass }
}

function gmailCredentials() {
    const { user, pass } = gmailValues()
    if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(user) || !/^[a-zA-Z0-9]{16}$/.test(pass))
        return null
    return { user, pass }
}

// Static codes only: these diagnostics must never contain addresses or secrets.
export function emailConfigurationIssues(): string[] {
    const provider = mailProvider()
    if (provider === "gmail") {
        const { user, pass } = gmailValues()
        const issues: string[] = []
        if (!/^[a-z0-9._%+-]+@gmail\.com$/.test(user)) issues.push("SMTP_USER_INVALID")
        if (!/^[a-zA-Z0-9]{16}$/.test(pass)) issues.push("SMTP_PASSWORD_INVALID")
        return issues
    }
    if (provider !== "resend") return ["EMAIL_PROVIDER_INVALID"]
    const issues: string[] = []
    if (!process.env.RESEND_API_KEY) issues.push("RESEND_API_KEY_MISSING")
    if (!process.env.RESEND_FROM_EMAIL) issues.push("RESEND_FROM_EMAIL_MISSING")
    return issues
}

export function emailDeliveryConfigured() {
    return emailConfigurationIssues().length === 0
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
    if (mailProvider() !== "gmail") return
    try {
        // Check credentials for every address, including unknown accounts, so a
        // broken sender produces the same error without revealing membership.
        await gmailTransport().verify()
    } catch {
        throw new EmailDeliveryUnavailable()
    }
}

export async function sendResetEmail(to: string, resetUrl: URL, requestId: string) {
    const subject = "Reset your Tech Hub password"
    const text = `Use this link to reset your Tech Hub password within 30 minutes:\n\n${resetUrl}\n\nIf you did not request this, ignore this email. Your password has not changed.`
    return sendSiteEmail({ to, subject, text, requestId, context: "reset" })
}

export async function sendContactEmail(to: string, input: { name: string; email: string; subject: string; message: string }, requestId: string) {
    return sendSiteEmail({
        to, requestId, context: "contact", replyTo: input.email,
        subject: `Tech Hub contact: ${input.subject || "Message from a reader"}`,
        text: `Contact form submission from mytechhub.online\nThis is a reader message, not a subscription or account notification.\nReference: ${requestId}\n\nName: ${input.name}\nReply email: ${input.email}\n\n${input.message}`,
    })
}

async function sendSiteEmail({ to, subject, text, requestId, context, replyTo }: {
    to: string; subject: string; text: string; requestId: string; context: "reset" | "contact"; replyTo?: string
}) {
    if (!emailDeliveryConfigured()) throw new EmailDeliveryUnavailable(context)
    try {
        if (mailProvider() === "gmail") {
            const auth = gmailCredentials()!
            const result = await gmailTransport().sendMail({
                from: { name: "Tech Hub", address: auth.user },
                to: { address: to, name: "" },
                subject,
                text,
                ...(replyTo ? { replyTo: { address: replyTo, name: "" } } : {}),
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
                "Idempotency-Key": `${context === "reset" ? "password-reset" : "contact"}-${requestId}`,
            },
            body: JSON.stringify({
                from: process.env.RESEND_FROM_EMAIL,
                to: [to],
                subject,
                text,
                ...(replyTo ? { reply_to: replyTo } : {}),
            }),
            signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) throw new EmailDeliveryUnavailable()
    } catch {
        // Provider exceptions can contain recipient addresses or SMTP credentials.
        throw new EmailDeliveryUnavailable(context)
    }
}
