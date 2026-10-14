export interface ContactMessage { name: string; email: string; subject: string; message: string }
export function validEmail(value: string) {
    return value.length <= 254 && /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,63}$/.test(value)
}
export function contactMessage(body: unknown): ContactMessage | null {
    if (!body || typeof body !== "object" || Array.isArray(body)) return null
    const raw = body as Record<string, unknown>
    if (raw.websiteTrap) return null
    const fields = ["name", "email", "subject", "message"] as const
    if (fields.some(key => typeof raw[key] !== "string")) return null
    const result = Object.fromEntries(fields.map(key => [key, (raw[key] as string).trim()])) as unknown as ContactMessage
    if (!result.name || result.name.length > 100 || /[\r\n\0]/.test(result.name) || !validEmail(result.email) ||
        result.subject.length > 150 || /[\r\n\0]/.test(result.subject) || result.message.length < 10 || result.message.length > 5000 || result.message.includes("\0")) return null
    return result
}
