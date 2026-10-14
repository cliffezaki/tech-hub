import { NextResponse } from "next/server"

import { handleError, requireAdmin, requireWritableStore, revalidateSite } from "@/lib/api"
import { getStore } from "@/lib/store"
import { DEFAULT_SETTINGS } from "@/lib/types"
import type { SiteSettings } from "@/lib/types"
import { randomUUID } from "node:crypto"
import { IDENTITY_IMAGES, ICON_FIELDS } from "@/lib/site-identity"
import { validEmail } from "@/lib/contact"

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
            if (key !== "identityVersion" && typeof body[key] === "string") {
                if (body[key].length > 2000) return NextResponse.json({ error: "A settings field is too long." }, { status: 400 })
                patch[key] = body[key]
            }
        }

        if (patch.siteName !== undefined && (!patch.siteName.trim() || patch.siteName.length > 80)) return NextResponse.json({ error: "Site name must contain 1–80 characters." }, { status: 400 })
        if (patch.contactEmail !== undefined) {
            patch.contactEmail = patch.contactEmail.trim()
            if (patch.contactEmail && !validEmail(patch.contactEmail)) return NextResponse.json({ error: "Enter a valid contact email address." }, { status: 400 })
        }
        if (patch.logoSame !== undefined && !["true", "false"].includes(patch.logoSame)) return NextResponse.json({ error: "Invalid logo mode." }, { status: 400 })
        if (patch.logoWidth !== undefined && (!Number.isFinite(Number(patch.logoWidth)) || Number(patch.logoWidth) < 80 || Number(patch.logoWidth) > 180)) return NextResponse.json({ error: "Logo display width must be 80–180 pixels." }, { status: 400 })
        const store = getStore()
        const current = await store.getSettings()
        const changedImages = IDENTITY_IMAGES.filter(key => patch[key] && patch[key] !== current[key])
        if (changedImages.length) {
            const media = await store.listMedia()
            if (changedImages.some(key => !media.some(asset => asset.url === patch[key] && asset.filename.startsWith("identity-") && (key === "iconIco" ? asset.filename.endsWith(".ico") : asset.url.endsWith(".png"))))) {
                return NextResponse.json({ error: "Use the Site Identity upload or media picker to prepare safe branding images." }, { status: 400 })
            }
        }
        if (ICON_FIELDS.some(key => patch[key] !== undefined)) {
            const next = { ...current, ...patch }
            if (ICON_FIELDS.some(key => Boolean(next[key])) && !ICON_FIELDS.every(key => Boolean(next[key]))) return NextResponse.json({ error: "Prepare a complete site icon before saving." }, { status: 400 })
        }
        patch.identityVersion = randomUUID()
        const settings = await store.saveSettings(patch)
        revalidateSite()
        return NextResponse.json(settings)
    } catch (error) {
        return handleError(error, "Failed to save settings")
    }
}
