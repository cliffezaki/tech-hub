import "server-only"

function endpoint() {
    try {
        const url = new URL(process.env.SUPABASE_URL || "")
        if (
            url.protocol !== "https:" ||
            !/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname) ||
            url.port ||
            url.username ||
            url.password ||
            url.pathname !== "/" ||
            url.search ||
            url.hash
        )
            return null
        return url
    } catch {
        return null
    }
}
export function supabaseConfigured() {
    return Boolean(
        endpoint() && process.env.SUPABASE_SECRET_KEY?.startsWith("sb_secret_")
    )
}
export function supabaseAttempted() {
    return Boolean(process.env.SUPABASE_URL || process.env.SUPABASE_SECRET_KEY)
}
function identifiers(collection: string, id?: string) {
    if (
        !/^[a-zA-Z0-9_-]+$/.test(collection) ||
        (id !== undefined && !/^[a-zA-Z0-9_-]+$/.test(id))
    )
        throw new Error("Invalid record identifier")
}
async function request(query: Record<string, string>, init: RequestInit = {}) {
    if (!supabaseConfigured())
        throw new Error(
            "Configure SUPABASE_URL and a server-only SUPABASE_SECRET_KEY for private CMS storage."
        )
    const url = new URL("/rest/v1/cms_records", endpoint()!)
    url.search = new URLSearchParams(query).toString()
    let response: Response
    try {
        response = await fetch(url, {
            ...init,
            headers: {
                apikey: process.env.SUPABASE_SECRET_KEY!,
                "Content-Type": "application/json",
                ...init.headers,
            },
            cache: "no-store",
            redirect: "error",
            signal: AbortSignal.timeout(10000),
        })
    } catch {
        throw new Error("Private CMS storage is temporarily unavailable.")
    }
    if (!response.ok) {
        // Provider errors can contain personal data or duplicate row values: never expose them.
        const body = await response.json().catch(() => null)
        if (response.status === 409 && body?.code === "23505") {
            const conflict = new Error(
                "This record already exists."
            ) as Error & { code: string }
            conflict.code = "23505"
            throw conflict
        }
        throw new Error(
            `Private CMS storage request failed (${response.status}). Check its configuration.`
        )
    }
    return response
}
export async function listSupabaseRecords<T>(collection: string): Promise<T[]> {
    identifiers(collection)
    const result: T[] = []
    let offset = 0
    // Continue even after a short page: a project can set a smaller API row limit.
    for (;;) {
        const response = await request({
            collection: `eq.${collection}`,
            select: "payload",
            order: "id.asc",
            limit: "500",
            offset: String(offset),
        })
        const page = (await response.json()) as { payload: T }[]
        if (!Array.isArray(page))
            throw new Error("Private CMS storage returned an invalid response.")
        if (!page.length) return result
        result.push(...page.map((row) => row.payload))
        offset += page.length
    }
}
export async function getSupabaseRecord<T>(
    collection: string,
    id: string
): Promise<T | null> {
    identifiers(collection, id)
    const response = await request({
        collection: `eq.${collection}`,
        id: `eq.${id}`,
        select: "payload",
        limit: "1",
    })
    const rows = (await response.json()) as { payload: T }[]
    return rows[0]?.payload ?? null
}
export async function saveSupabaseRecord<T>(
    collection: string,
    id: string,
    value: T,
    createOnly: boolean
) {
    identifiers(collection, id)
    await request(createOnly ? {} : { on_conflict: "collection,id" }, {
        method: "POST",
        headers: {
            Prefer: createOnly
                ? "return=minimal"
                : "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify({ collection, id, payload: value }),
    })
    return value
}
export async function deleteSupabaseRecord(collection: string, id: string) {
    identifiers(collection, id)
    await request(
        { collection: `eq.${collection}`, id: `eq.${id}` },
        { method: "DELETE" }
    )
}
