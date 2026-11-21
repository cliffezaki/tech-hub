import { getSiteSettings } from "@/lib/content"
import { NextResponse } from "next/server"
import { getSiteUrl } from "@/lib/site"
export const dynamic = "force-dynamic"
export async function GET() {
    const settings = await getSiteSettings()
    const response = NextResponse.redirect(new URL(settings.iconIco || "/site-icon.svg", getSiteUrl()), 307)
    response.headers.set("Cache-Control", "no-store, max-age=0")
    return response
}
