import { NextResponse } from "next/server"

import { handleError, requireAdmin, requireWritableStore, revalidateSite } from "@/lib/api"
import { getStore } from "@/lib/store"
import { DEFAULT_SETTINGS } from "@/lib/types"
import type { SiteSettings } from "@/lib/types"

export async function GET() {
    try {
        return NextResponse.json(await getStore().getSettings())
    } catch (error) {
        return handleError(error, "Failed to fetch settings")
    }
}

export async function PUT(request: Request) {
    const unauthorized = await requireAdmin()
    if (unauthorized) return unauthorized

    const readOnly = requireWritableStore()
    if (readOnly) return readOnly

    try {
        const body = await request.json()
        const patch: Partial<SiteSettings> = {}

        for (const key of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) {
            if (typeof body[key] === "string") {
                patch[key] = body[key]
            }
        }

        const settings = await getStore().saveSettings(patch)
        revalidateSite()
        return NextResponse.json(settings)
    } catch (error) {
        return handleError(error, "Failed to save settings")
    }
}
