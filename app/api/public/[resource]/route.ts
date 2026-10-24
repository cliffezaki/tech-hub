import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { allowMeasurement, measurementGeography, measurementReferrer } from "@/lib/anonymous-analytics"
import {
    listRecords,
    getRecord,
    saveRecord,
    claim,
    platformReady,
} from "@/lib/platform-store"
import { cleanRecord, MODULES, type RecordData } from "@/lib/modules"
import { currentUser, sameOrigin, throttle } from "@/lib/accounts"
import { activeAds, publishingConfig } from "@/lib/advertising"
import { getStore } from "@/lib/store"
import { readNavigation } from "@/lib/navigation"
import { publicItems } from "@/lib/menu-layout"
type Context = { params: Promise<{ resource: string }> }
export async function GET(request: Request, { params }: Context) {
    const { resource } = await params
    const url = new URL(request.url)
    if (!platformReady() && resource !== "navigation")
        return NextResponse.json(
            resource === "config" ? { analytics: false, comments: false } : []
        )
    try {
        if (resource === "navigation") {
            const { layout, pages } = await readNavigation()
            return NextResponse.json(publicItems(layout, pages), {headers:{"Cache-Control":"no-store"}})
        }
        if (resource === "config") {
            const config = await publishingConfig()
            return NextResponse.json({
                analytics: config?.analytics === true,
                comments: config?.comments === true,
            })
        }
        if (resource === "ads")
            return NextResponse.json(
                await activeAds(
                    url.searchParams.get("slot") || "",
                    url.searchParams.get("path") || "/"
                )
            )
        if (resource === "comments")
            return NextResponse.json(
                (await listRecords<RecordData>("comments"))
                    .filter(
                        (c) =>
                            c.status === "approved" &&
                            c.articleId === url.searchParams.get("articleId")
                    )
                    .map((c) => ({
                        id: c.id,
                        name: c.name,
                        message: c.message,
                        createdAt: c.createdAt,
                    }))
            )
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    } catch {
        return NextResponse.json(
            { error: "This service is temporarily unavailable." },
            { status: 503 }
        )
    }
}
export async function POST(request: Request, { params }: Context) {
    try {
        if (!(await sameOrigin()))
            return NextResponse.json(
                { error: "Invalid origin" },
                { status: 403 }
            )
        if (!platformReady())
            return NextResponse.json(
                {
                    error: "This service is awaiting private CMS storage configuration.",
                },
                { status: 503 }
            )
        const { resource } = await params
        const raw = await request.text()
        if (raw.length > 24000)
            return NextResponse.json(
                { error: "Submission is too large." },
                { status: 413 }
            )
        const body = JSON.parse(raw)
        if (resource === "inquiries") {
            if (
                body.websiteTrap ||
                !body.consent ||
                !Number.isFinite(body.startedAt) ||
                Date.now() - body.startedAt < 3000
            )
                return NextResponse.json(
                    { error: "Please complete the form and consent." },
                    { status: 400 }
                )
            if (
                !(await throttle(
                    `inquiry:${String(body.email).toLowerCase()}`,
                    3
                ))
            )
                return NextResponse.json(
                    { error: "Please try again later." },
                    { status: 429 }
                )
            const id = randomUUID()
            const data = cleanRecord(MODULES.inquiries, {
                ...body,
                status: "new",
            })
            await saveRecord("inquiries", id, {
                ...data,
                id,
                consentAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
            })
            return NextResponse.json({
                message: "Thank you. Your inquiry has been saved for our team.",
            })
        }
        if (resource === "comments") {
            const user = await currentUser()
            if (!user || !(await publishingConfig())?.comments)
                return NextResponse.json(
                    {
                        error: "Sign in to comment. Comments must be enabled by the publisher.",
                    },
                    { status: 403 }
                )
            const article = await getStore().getArticle(
                String(body.articleId || ""), false
            )
            if (!article || !articleVisible(article))
                return NextResponse.json(
                    { error: "Article not found" },
                    { status: 404 }
                )
            const message = String(body.message || "").trim()
            if (!message || message.length > 3000)
                throw new Error(
                    "Comments must be between 1 and 3,000 characters."
                )
            if (!(await throttle(`comment:${user.id}`, 10)))
                return NextResponse.json(
                    { error: "Please try again later." },
                    { status: 429 }
                )
            const id = randomUUID()
            await saveRecord("comments", id, {
                id,
                name: user.name,
                userId: user.id,
                articleId: article.id,
                message,
                status: "pending",
                createdAt: new Date().toISOString(),
            })
            return NextResponse.json({
                message: "Your comment is awaiting moderation.",
            })
        }
        if (resource === "event") {
            if (
                (body.mode !== "anonymous" && !body.consent) ||
                request.headers.get("sec-gpc") === "1" ||
                request.headers.get("dnt") === "1" ||
                !(await publishingConfig())?.analytics
            )
                return NextResponse.json({ ok: true })
            if (
                !["view", "impression", "click"].includes(body.kind) ||
                !/^[a-f0-9-]{36}$/.test(body.eventId)
            )
                throw new Error("Invalid event")
            const pathname = String(body.path || "")
                .split("?")[0]
                .slice(0, 300)
            if (
                !pathname.startsWith("/") ||
                pathname.startsWith("//") ||
                /^\/(admin|account|api)/.test(pathname)
            )
                throw new Error("Invalid page")
            if (body.kind !== "view") {
                const campaign = await getRecord<RecordData>(
                    "campaigns",
                    String(body.campaign || "")
                )
                const today = new Date().toISOString().slice(0, 10)
                if (
                    !campaign ||
                    !["active", "scheduled"].includes(
                        String(campaign.status)
                    ) ||
                    String(campaign.start) > today ||
                    String(campaign.end) < today
                )
                    throw new Error("Inactive campaign")
            }
            if (!allowMeasurement(request))
                return NextResponse.json({ ok: true })
            const ua = request.headers.get("user-agent") || ""
            if (/bot|crawler|spider/i.test(ua))
                return NextResponse.json({ ok: true })
            const referrer = measurementReferrer(body.referrer)
            const event = {
                id: body.eventId,
                kind: body.kind,
                mode: "anonymous",
                ...measurementGeography(request),
                path: pathname,
                campaign: String(body.campaign || ""),
                placement: String(body.placement || ""),
                device: /mobile|android|iphone/i.test(ua)
                    ? "Mobile"
                    : "Desktop",
                browser: /Edg\//.test(ua)
                    ? "Edge"
                    : /Firefox\//.test(ua)
                      ? "Firefox"
                      : /Chrome\//.test(ua)
                        ? "Chrome"
                        : /Safari\//.test(ua)
                          ? "Safari"
                          : "Other",
                referrer,
                at: new Date().toISOString().slice(0, 10),
            }
            await claim("events", body.eventId, event)
            return NextResponse.json({ ok: true })
        }
        return NextResponse.json({ error: "Not found" }, { status: 404 })
    } catch (e) {
        return NextResponse.json(
            { error: e instanceof Error ? e.message : "Submission failed" },
            { status: 400 }
        )
    }
}
import { articleVisible } from "@/lib/article-visibility"
