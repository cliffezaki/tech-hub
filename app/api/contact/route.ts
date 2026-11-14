import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { sameOrigin, throttle } from "@/lib/accounts"
import { platformReady } from "@/lib/platform-store"
import { emailDeliveryConfigured, sendContactEmail, EmailDeliveryUnavailable } from "@/lib/email"
import { getStore } from "@/lib/store"
import {contactToken,validContactToken,contactNetworkKey} from "@/lib/contact-guard"
import { contactMessage, validEmail, contactLooksAutomated } from "@/lib/contact"

export const runtime = "nodejs"
const headers = { "Cache-Control": "no-store" }
const json = (body: object, status: number, extra: Record<string, string> = {}) => NextResponse.json(body, { status, headers: { ...headers, ...extra } })

export async function GET(){
    try{return json({token:contactToken()},200)}catch{return json({error:"The contact form is temporarily unavailable."},503)}
}

export async function POST(request: Request) {
    try {
        if (!(await sameOrigin())) return json({ error: "Invalid request origin." }, 403)
        if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) return json({ error: "Submit the contact form as JSON." }, 415)
        if (Number(request.headers.get("content-length")) > 24000) return json({ error: "Your message is too large." }, 413)
        // Bound the stream too; chunked requests need not include Content-Length.
        const reader = request.body?.getReader()
        if (!reader) return json({ error: "Complete the contact form." }, 400)
        const chunks: Uint8Array[] = []
        let size = 0
        while (true) {
            const chunk = await reader.read()
            if (chunk.done) break
            size += chunk.value.length
            if (size > 24000) { await reader.cancel(); return json({ error: "Your message is too large." }, 413) }
            chunks.push(chunk.value)
        }
        let raw: unknown
        try { raw = JSON.parse(Buffer.concat(chunks).toString("utf8")) } catch { return json({ error: "Complete the contact form with valid details." }, 400) }
        const input = contactMessage(raw)
        if (!input) return json({ error: "Enter your name, a valid email address and a message of 10–5,000 characters." }, 400)
        if(contactLooksAutomated(input)) return json({error:"Please describe your request in a meaningful message. Automated submissions are not accepted."},400)
        if(!validContactToken((raw as Record<string,unknown>).formToken)) return json({error:"Please reload the form and try again after completing your message."},400)
        if(!(await throttle(`contact:network:${contactNetworkKey(request)}`,5)))return json({error:"Too many messages from this connection. Please try again in 15 minutes."},429,{"Retry-After":"900"})
        const recipient = (await getStore().getSettings()).contactEmail.trim()
        if (!platformReady() || !emailDeliveryConfigured() || !validEmail(recipient)) return json({ error: "The contact form is temporarily unavailable. Please use the email address on this page." }, 503)
        if (!(await throttle(`contact:${input.email.toLowerCase()}`, 3)) || !(await throttle("contact:site", 30))) return json({ error: "Too many messages. Please try again in 15 minutes." }, 429, { "Retry-After": "900" })
        // Recipient and sender are site-controlled. The visitor is Reply-To only.
        await sendContactEmail(recipient, input, randomUUID())
        return json({ message: "Thank you. Your message has been sent to the Tech Hub team." }, 200)
    } catch (error) {
        // Never log message bodies, addresses, provider credentials or provider errors.
        console.error("Contact message delivery failed.")
        return json({ error: error instanceof EmailDeliveryUnavailable ? error.message : "Your message could not be sent right now. Please try again later." }, 503)
    }
}
