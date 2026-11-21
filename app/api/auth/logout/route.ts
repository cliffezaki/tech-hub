import { NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/auth"
import { currentUser, sameOrigin } from "@/lib/accounts"
import { replaceRecord, RecordConflict } from "@/lib/platform-store"
export async function POST() {
    if (!await sameOrigin()) return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
    try {
        for (let attempt = 0; attempt < 2; attempt++) {
            const user = await currentUser()
            if (!user) break
            try { await replaceRecord("users", user.id, user, { ...user, sessionVersion: user.sessionVersion + 1 }); break }
            catch (error) { if (!(error instanceof RecordConflict) || attempt === 1) throw error }
        }
        const response = NextResponse.json({ ok: true })
        response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0, httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production" })
        return response
    } catch { return NextResponse.json({ error: "Could not end your sessions. Please try again." }, { status: 503 }) }
}
