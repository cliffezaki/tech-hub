import { NextResponse } from "next/server"

import {
    SESSION_COOKIE,
    SESSION_MAX_AGE_SECONDS,
    createSessionToken,
    isAuthConfigured,
    verifyPassword,
} from "@/lib/auth"

export async function POST(request: Request) {
    if (!isAuthConfigured()) {
        return NextResponse.json(
            { error: "No dashboard password is set. Add ADMIN_PASSWORD to your environment variables." },
            { status: 503 }
        )
    }

    const body = await request.json().catch(() => ({}))

    if (!verifyPassword(String(body.password || ""))) {
        return NextResponse.json({ error: "Incorrect password." }, { status: 401 })
    }

    const response = NextResponse.json({ ok: true })
    response.cookies.set(SESSION_COOKIE, await createSessionToken(), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: SESSION_MAX_AGE_SECONDS,
    })

    return response
}
