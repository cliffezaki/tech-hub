import { NextResponse, type NextRequest } from "next/server"
import { readSession, SESSION_COOKIE } from "@/lib/auth"
export default async function proxy(request: NextRequest) {
    if (
        request.nextUrl.pathname.startsWith("/admin") &&
        request.nextUrl.pathname !== "/admin/login" &&
        !(await readSession(request.cookies.get(SESSION_COOKIE)?.value))
    )
        return NextResponse.redirect(new URL("/account", request.url))
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
        const origin = request.headers.get("origin")
        if (!origin || new URL(origin).host !== request.headers.get("host"))
            return NextResponse.json(
                { error: "Request origin is not allowed." },
                { status: 403 }
            )
    }
    return NextResponse.next()
}
export const config = { matcher: ["/admin/:path*", "/api/:path*"] }
