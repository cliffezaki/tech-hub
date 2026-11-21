import { NextResponse } from "next/server"
import { currentUser, sameOrigin } from "@/lib/accounts"
import { getStore } from "@/lib/store"
import { revalidateSite } from "@/lib/api"
import { demoSeedEnabled, seedDemoStory } from "@/lib/demo-seed"
import { DEMO_BATCH, DEMO_STORIES } from "@/lib/demo-content"

export const maxDuration = 60
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
    const user = await currentUser()
    if (user?.role !== "owner")
        return NextResponse.json({ error: "Owner access required." }, { status: 403 })
    return NextResponse.json({
        enabled: demoSeedEnabled() && getStore().writable,
        batch: DEMO_BATCH,
        count: DEMO_STORIES.length,
        sections: DEMO_STORIES.reduce<Record<string, number>>((counts, s) => {
            counts[s.section] = (counts[s.section] || 0) + 1
            return counts
        }, {}),
    }, { headers: { "Cache-Control": "no-store" } })
}

export async function POST(request: Request) {
    if (!(await sameOrigin()))
        return NextResponse.json({ error: "Invalid request origin." }, { status: 403 })
    const user = await currentUser()
    if (user?.role !== "owner")
        return NextResponse.json({ error: "Owner access required." }, { status: 403 })
    if (!demoSeedEnabled())
        return NextResponse.json({ error: "Samples can only be added to the staging preview." }, { status: 403 })
    const store = getStore()
    if (!store.writable)
        return NextResponse.json({ error: "Content storage is read-only." }, { status: 503 })
    let body: { index?: unknown }
    try { body = await request.json() }
    catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }) }
    if (!Number.isInteger(body.index) || Number(body.index) < 0 || Number(body.index) >= DEMO_STORIES.length)
        return NextResponse.json({ error: "Choose a valid sample article." }, { status: 400 })
    try {
        const result = await seedDemoStory(store, Number(body.index), user.id)
        revalidateSite()
        return NextResponse.json(result, { status: result.skipped ? 200 : 201 })
    } catch {
        // Do not expose service tokens or upstream diagnostics in a public response.
        console.error("Staging sample import failed. Check CMS write access and slug collisions.")
        return NextResponse.json({
            error: "Could not save this sample. Check staging CMS write access and existing article slugs, then retry. Already saved samples will not be overwritten.",
        }, { status: 503 })
    }
}
