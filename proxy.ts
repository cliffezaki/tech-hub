import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import { SESSION_COOKIE, isAdminAccessOpen, isAuthConfigured, verifySessionToken } from "@/lib/auth"

const WRITE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"])

/** API paths whose write methods require an admin session. */
const PROTECTED_API_PREFIXES = ["/api/articles", "/api/pages", "/api/media", "/api/settings"]

export default async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl
    const isAdminPage = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")
    const isProtectedApi =
        PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && WRITE_METHODS.has(request.method)

    if (!isAdminPage && !isProtectedApi) {
        return NextResponse.next()
    }

    if (isAdminAccessOpen()) {
        return NextResponse.next()
    }

    const authorized = await verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value)
    if (authorized) {
        return NextResponse.next()
    }

    if (isProtectedApi) {
        return NextResponse.json(
            {
                error: isAuthConfigured()
                    ? "Sign in to the dashboard to make changes."
                    : "ADMIN_PASSWORD is not set on this deployment, so the dashboard is locked.",
            },
            { status: 401 }
        )
    }

    const loginUrl = new URL("/admin/login", request.url)
    loginUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(loginUrl)
}

export const config = {
    matcher: ["/admin/:path*", "/api/articles/:path*", "/api/pages/:path*", "/api/media/:path*", "/api/settings/:path*"],
}
