import { NextResponse } from "next/server"

import { SESSION_COOKIE } from "@/lib/auth"
import { currentUser, sameOrigin } from "@/lib/accounts"
import { saveRecord } from "@/lib/platform-store"

export async function POST() {
    if (!await sameOrigin()) return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
    const user = await currentUser()
    if (user) await saveRecord("users", user.id, { ...user, sessionVersion: user.sessionVersion + 1 })
    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 })
    return response
}
