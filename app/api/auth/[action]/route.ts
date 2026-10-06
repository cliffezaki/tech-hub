import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"
import {
    resetConfigured,
    requestReset,
    redeemReset,
} from "@/lib/password-reset"
import {
    currentUser,
    emailId,
    hashPassword,
    checkPassword,
    userPermissions,
    sameOrigin,
    throttle,
} from "@/lib/accounts"
import { getRecord, saveRecord, platformReady } from "@/lib/platform-store"
import { safeUser, type User } from "@/lib/permissions"
import {
    createSessionToken,
    isAuthConfigured,
    SESSION_COOKIE,
    SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth"
export async function GET() {
    const user = platformReady() ? await currentUser() : null
    return NextResponse.json(
        {
            user: user ? safeUser(user) : null,
            permissions: user ? await userPermissions(user) : [],
            configured: platformReady() && isAuthConfigured(),
            resetConfigured: resetConfigured(),
        },
        { headers: { "Cache-Control": "no-store" } }
    )
}
export async function POST(request: Request) {
    try {
        if (!(await sameOrigin()))
            return NextResponse.json(
                { error: "Invalid request origin." },
                { status: 403 }
            )
        if (!platformReady() || !isAuthConfigured())
            return NextResponse.json(
                {
                    error: "Accounts need a session secret and private CMS storage configured by the site owner.",
                },
                { status: 503 }
            )
        const action = new URL(request.url).pathname.split("/").pop()
        const body = await request.json()
        const email = String(body.email || "")
            .trim()
            .toLowerCase()
        const id = emailId(email)
        if (action === "reset") {
            await redeemReset(
                String(body.token || ""),
                String(body.password || "")
            )
            const response = NextResponse.json({
                message: "Password reset. Sign in with your new password.",
            })
            response.cookies.set(SESSION_COOKIE, "", {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: 0,
            })
            return response
        }
        if (action === "profile") {
            const user = await currentUser()
            if (!user)
                return NextResponse.json(
                    { error: "Sign in first." },
                    { status: 401 }
                )
            user.name = String(body.name || user.name).slice(0, 100)
            user.subscribed = body.subscribed === true
            if (body.password) {
                if (
                    !(await checkPassword(
                        String(body.currentPassword || ""),
                        user.passwordHash
                    ))
                )
                    return NextResponse.json(
                        { error: "Current password is incorrect." },
                        { status: 400 }
                    )
                user.passwordHash = await hashPassword(body.password)
                user.sessionVersion++
            }
            await saveRecord("users", user.id, user)
            const response = NextResponse.json({
                user: safeUser(user),
                message: "Profile saved.",
            })
            response.cookies.set(
                SESSION_COOKIE,
                await createSessionToken(user.id, user.sessionVersion),
                {
                    httpOnly: true,
                    sameSite: "lax",
                    secure: process.env.NODE_ENV === "production",
                    path: "/",
                    maxAge: SESSION_MAX_AGE_SECONDS,
                }
            )
            return response
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
            return NextResponse.json(
                { error: "Enter a valid email address." },
                { status: 400 }
            )
        if (!(await throttle(`${action}:${id}`)))
            return NextResponse.json(
                { error: "Too many attempts. Try again in 15 minutes." },
                { status: 429 }
            )
        if (action === "forgot") {
            if (!resetConfigured())
                return NextResponse.json(
                    {
                        error: "Password-reset email delivery is not configured. Contact the site owner for account recovery.",
                    },
                    { status: 503 }
                )
            await requestReset(email)
            return NextResponse.json({
                message:
                    "If this address belongs to an active account, a reset link will be sent. Check your inbox and spam folder.",
            })
        }
        let user = await getRecord<User>("users", id)
        if (action === "register" || action === "setup") {
            const ownerEmail = process.env.OWNER_EMAIL?.trim().toLowerCase()
            const config = await getRecord<{ registration?: boolean }>(
                "config",
                "publishing"
            )
            if (
                action === "register" &&
                (config?.registration === false || email === ownerEmail)
            )
                throw new Error(
                    "Registration is unavailable for this address. Use owner setup for the reserved owner account."
                )
            if (action === "setup") {
                const expected = Buffer.from(
                    process.env.OWNER_SETUP_TOKEN || ""
                )
                const actual = Buffer.from(String(body.setupToken || ""))
                if (
                    !ownerEmail ||
                    email !== ownerEmail ||
                    expected.length < 32 ||
                    actual.length !== expected.length ||
                    !timingSafeEqual(expected, actual)
                )
                    return NextResponse.json(
                        { error: "Invalid owner setup details." },
                        { status: 403 }
                    )
            }
            if (user)
                throw new Error(
                    "This account already exists. Sign in or contact the owner for recovery."
                )
            user = {
                id,
                email,
                name: String(body.name || "Reader").slice(0, 100),
                passwordHash: await hashPassword(String(body.password || "")),
                role: action === "setup" ? "owner" : "reader",
                status: "active",
                sessionVersion: 1,
                createdAt: new Date().toISOString(),
                subscribed: body.subscribed === true,
            }
            await saveRecord("users", id, user, true)
        } else if (action === "login") {
            if (
                !user ||
                !(await checkPassword(
                    String(body.password || ""),
                    user.passwordHash
                )) ||
                user.status !== "active"
            )
                return NextResponse.json(
                    {
                        error: "Email or password is incorrect, or the account is unavailable.",
                    },
                    { status: 401 }
                )
        } else
            return NextResponse.json(
                { error: "Unknown action." },
                { status: 404 }
            )
        const permissions = await userPermissions(user!)
        const response = NextResponse.json({
            user: safeUser(user!),
            redirect: permissions.length ? "/admin" : "/account",
        })
        response.cookies.set(
            SESSION_COOKIE,
            await createSessionToken(user!.id, user!.sessionVersion),
            {
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
                path: "/",
                maxAge: SESSION_MAX_AGE_SECONDS,
            }
        )
        return response
    } catch (e) {
        return NextResponse.json(
            {
                error:
                    e instanceof Error ? e.message : "Account request failed.",
            },
            { status: 400 }
        )
    }
}
