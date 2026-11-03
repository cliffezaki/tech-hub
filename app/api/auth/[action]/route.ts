import { verifyNewsletter } from "@/lib/newsletter-verification"
import { NextResponse } from "next/server"
import {
    resetConfigured,
    resetConfigurationIssues,
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
import { getRecord, replaceRecord, platformReady } from "@/lib/platform-store"
import { safeUser, type User } from "@/lib/permissions"
import { EmailDeliveryUnavailable } from "@/lib/email"
import {
    createSessionToken,
    isAuthConfigured,
    SESSION_COOKIE,
    SESSION_MAX_AGE_SECONDS,
} from "@/lib/auth"
import { readJson } from "@/lib/request-security"
import { contactNetworkKey } from "@/lib/contact-guard"
import { requestVerification, verifyAccount } from "@/lib/email-verification"
export async function GET() {
    const user = platformReady() ? await currentUser() : null
    if (user) {
        const subscription = await getRecord<{active?:boolean}>("subscriptions",emailId(user.email))
        if(subscription) user.subscribed = subscription.active !== false
    }
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
        if (!await throttle(`auth-network:${contactNetworkKey(request)}`, 60))
            return NextResponse.json({ error: "Too many attempts. Try again in 15 minutes." }, { status: 429, headers: { "Retry-After": "900" } })
        const body = await readJson(request)
        if (action === "verify-newsletter") {
            await verifyNewsletter(String(body.token || ""))
            return NextResponse.json({ message: "Your newsletter subscription is confirmed." })
        }
        if (action === "verify") {
            await verifyAccount(String(body.token || ""))
            return NextResponse.json({ message: "Email verified. Sign in to open your reading list." })
        }
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
            let user = await currentUser()
            if (!user)
                return NextResponse.json(
                    { error: "Sign in first." },
                    { status: 401 }
                )
            const previous = { ...user }
            user.name = String(body.name || user.name).slice(0, 100)
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
                user.passwordHash = await hashPassword(String(body.password))
                user.sessionVersion++
            }
            const subscriptionKey=emailId(user.email)
            const subscription=await getRecord<Record<string,unknown> & {recordVersion?:number}>("subscriptions",subscriptionKey)
            if (typeof body.subscribed === "boolean") {
                user.subscribed=body.subscribed
                if(subscription) await replaceRecord("subscriptions",subscriptionKey,subscription,{...subscription,active:body.subscribed,updatedAt:new Date().toISOString()})
            } else if(subscription) user.subscribed=subscription.active!==false
            user = await replaceRecord("users", user.id, previous, user)
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
                { status: 429, headers: { "Retry-After": "900", "Cache-Control": "no-store" } }
            )
        if (action === "forgot") {
            if (!resetConfigured())
            {
                // Hosting logs receive only static issue codes, never submitted
                // addresses, passwords, API keys or reset tokens.
                console.error("Password-reset configuration issues:", resetConfigurationIssues().join(","))
                return NextResponse.json(
                    {
                        error: "Password-reset email delivery is not configured. Contact the site owner for account recovery.",
                    },
                    { status: 503 }
                )
            }
            await requestReset(email)
            return NextResponse.json({
                message:
                    "If this address belongs to an active account, a reset link will be sent. Check your inbox and spam folder.",
            })
        }
        let user = await getRecord<User>("users", id)
        if (action === "register") {
            const config = await getRecord<{ registration?: boolean }>(
                "config",
                "publishing"
            )
            if (config?.registration === false)
                throw new Error("New account registration is currently unavailable.")
            if (body.password !== body.confirmPassword) throw new Error("Passwords do not match.")
            user = {
                id,
                email,
                name: String(body.name || "Reader").slice(0, 100),
                passwordHash: await hashPassword(String(body.password || "")),
                role: "reader",
                status: "active",
                sessionVersion: 1,
                createdAt: new Date().toISOString(),
                subscribed: body.subscribed === true,
            }
            await requestVerification(user)
            return NextResponse.json({ message: "If this email can be registered, a verification link will arrive shortly. Already registered? Sign in or recover your password." })
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
            redirect: permissions.length ? "/admin" : "/reader",
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
            { status: e instanceof EmailDeliveryUnavailable ? 503 : e instanceof Error && "status" in e ? Number(e.status) : 400 }
        )
    }
}
