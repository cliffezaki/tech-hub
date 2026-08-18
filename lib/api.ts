import "server-only"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import { SESSION_COOKIE, isAdminAccessOpen, verifySessionToken } from "@/lib/auth"
import { getStore } from "@/lib/store"

/**
 * Middleware already blocks unauthenticated writes; this repeats the check inside the
 * handler so a route is never left open if the matcher config changes.
 */
export async function requireAdmin() {
    if (isAdminAccessOpen()) {
        return null
    }

    const store = await cookies()
    if (await verifySessionToken(store.get(SESSION_COOKIE)?.value)) {
        return null
    }

    return NextResponse.json({ error: "Not authorised." }, { status: 401 })
}

/** Turns a read-only environment into an explanation rather than a filesystem crash. */
export function requireWritableStore() {
    const store = getStore()

    if (store.writable) {
        return null
    }

    return NextResponse.json(
        {
            error:
                store.mode === "sanity"
                    ? "Sanity is connected but no write token is configured, so changes cannot be saved."
                    : "This deployment has no CMS database connected, so content cannot be edited here.",
        },
        { status: 503 }
    )
}

/** Public pages are cached; content edits have to invalidate them to show up immediately. */
export function revalidateSite() {
    revalidatePath("/", "layout")
}

export function handleError(error: unknown, fallback: string) {
    console.error(fallback, error)
    const message = error instanceof Error ? error.message : fallback
    return NextResponse.json({ error: message }, { status: 500 })
}
