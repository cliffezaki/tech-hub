import "server-only"

import { revalidatePath } from "next/cache"
import { NextResponse } from "next/server"

import { authorized, sameOrigin } from "@/lib/accounts"
import type { Permission } from "@/lib/permissions"
import { getStore } from "@/lib/store"

/**
 * Middleware already blocks unauthenticated writes; this repeats the check inside the
 * handler so a route is never left open if the matcher config changes.
 */
export async function requireAdmin(permission: Permission = "settings.manage") {
    if (!(await sameOrigin()))
        return NextResponse.json(
            { error: "Request origin is not allowed." },
            { status: 403 }
        )
    if (
        (await authorized(permission)) ||
        (permission === "articles.editOwn" &&
            (await authorized("articles.editAll")))
    )
        return null
    return NextResponse.json(
        { error: "You do not have permission for this action." },
        { status: 403 }
    )
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
