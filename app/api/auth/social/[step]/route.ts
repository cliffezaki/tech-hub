import { createHash, randomBytes } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { currentUser, emailId } from "@/lib/accounts"
import { claim, getRecord } from "@/lib/platform-store"
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth"
import type { User } from "@/lib/permissions"

const cookie = "techhub_oauth"
const flags = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/api/auth/social" }

async function enabledProviders(base: URL, key?: string): Promise<string[]> {
    if (!key) return []
    const response = await fetch(new URL("settings",base),{
        headers:{apikey:key}, redirect:"error", cache:"no-store", signal:AbortSignal.timeout(8000)
    })
    if (!response.ok) return []
    const settings = await response.json()
    return ["google","apple"].filter(provider => settings.external?.[provider] === true)
}

export async function GET(req: NextRequest, { params }: {params: Promise<{step:string}>}) {
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "https://mytechhub.online"
    const account = new URL("/account", origin)
    function finish(issue?:string) {
        if (issue) account.searchParams.set("social",issue)
        const response = NextResponse.redirect(account)
        response.cookies.set(cookie,"",{...flags,maxAge:0})
        response.headers.set("Cache-Control","no-store")
        return response
    }
    try {
        const base = new URL("/auth/v1/", process.env.SUPABASE_URL)
        const key = process.env.SUPABASE_SECRET_KEY
        
        const {step} = await params
        if (step === "providers") {
            const providers = await enabledProviders(base,key)
            return NextResponse.json({providers},{headers:{"Cache-Control":"no-store"}})
        }
        if (!key) return finish("unavailable")
        const headers = {apikey:key,"Content-Type":"application/json"}
        if (step === "google" || step === "apple") {
            if (!(await enabledProviders(base,key)).includes(step)) return finish("unavailable")
            const verifier = randomBytes(48).toString("base64url")
            const url = new URL("authorize",base)
            url.search = new URLSearchParams({provider:step,redirect_to:new URL("/api/auth/social/callback",origin).href,code_challenge:createHash("sha256").update(verifier).digest("base64url"),code_challenge_method:"s256"}).toString()
            const response = NextResponse.redirect(url)
            response.cookies.set(cookie,step+"."+verifier,{...flags,maxAge:600})
            response.headers.set("Cache-Control","no-store")
            return response
        }
        const [provider,verifier] = (req.cookies.get(cookie)?.value || "").split(".")
        const code = req.nextUrl.searchParams.get("code")
        if(step!=="callback" || !code || !["google","apple"].includes(provider) || !verifier) return finish("cancelled")
        const exchange = await fetch(new URL("token?grant_type=pkce",base),{method:"POST",redirect:"error",headers,body:JSON.stringify({auth_code:code,code_verifier:verifier}),cache:"no-store"})
        if(!exchange.ok) return finish("cancelled")
        const {user:external} = await exchange.json()
        const identity = external?.identities?.find((i:{provider:string})=>i.provider===provider)?.identity_data
        if (!identity?.sub || !identity.email || ![true,"true"].includes(identity.email_verified) || !external.email_confirmed_at) return finish("unverified")
        const email = String(identity.email).trim().toLowerCase()
        const id = emailId(email)
        const identityKey = emailId(provider+":"+identity.sub)
        const linked = await getRecord<{id:string}>("social-identities",identityKey)
        let user = await getRecord<User>("users",linked?.id || id)
        if (!linked) {
            const signedIn = await currentUser()
            if (user && signedIn?.id !== id) return finish("link")
            if (!user) {
                if (signedIn || (await getRecord<{registration?:boolean}>("config","publishing"))?.registration === false) return finish("unavailable")
                const now = new Date().toISOString()
                user = {id,email,name:String(identity.full_name || email.split("@")[0]).slice(0,100),role:"reader",status:"active",passwordHash:"",sessionVersion:1,emailVerifiedAt:now,createdAt:now,subscribed:false}
                if (!await claim("users",id,user)) return finish("link")
            }
            if(user.status !== "active") return finish("unavailable")
            if(!await claim("social-identities",identityKey,{id})) return finish("cancelled")
        }
        if (!user || user.status !== "active") return finish("unavailable")
        const response = finish()
        response.cookies.set(SESSION_COOKIE,await createSessionToken(user.id,user.sessionVersion),{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:SESSION_MAX_AGE_SECONDS})
        return response
    } catch { return finish("unavailable") }
}
