import "server-only"

export class RequestError extends Error {
    constructor(message: string, public status = 400) { super(message) }
}

export function originMatches(origin: string | null, host: string | null) {
    if (!origin || !host) return false
    try {
        const url = new URL(origin)
        return ["https:", "http:"].includes(url.protocol) && url.host === host &&
            !url.username && !url.password && url.origin === origin
    } catch { return false }
}

export async function readJson(request: Request, maximum = 24000): Promise<Record<string, unknown>> {
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json"))
        throw new RequestError("Send a JSON request.", 415)
    const reader = request.body?.getReader()
    if (!reader) throw new RequestError("Complete the form.")
    const chunks: Uint8Array[] = []
    let length = 0
    while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        length += chunk.value.length
        if (length > maximum) {
            await reader.cancel()
            throw new RequestError("Submission is too large.", 413)
        }
        chunks.push(chunk.value)
    }
    try {
        const result = JSON.parse(Buffer.concat(chunks).toString("utf8"))
        if (!result || typeof result !== "object" || Array.isArray(result)) throw new Error()
        return result
    } catch { throw new RequestError("Complete the form with valid details.") }
}
