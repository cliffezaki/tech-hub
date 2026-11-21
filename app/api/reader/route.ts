import { NextResponse } from "next/server"
import { currentUser, sameOrigin, throttle } from "@/lib/accounts"
import { readJson } from "@/lib/request-security"
import { getAllArticleSummaries } from "@/lib/content"
import { listRecords, claim } from "@/lib/platform-store"
import { readReaderState, updateReaderState } from "@/lib/reader-state"
const headers = { "Cache-Control": "private, no-store" }
export async function GET(request: Request) {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: "Sign in to use your reading list." }, { status: 401, headers })
    try {
        const state = await readReaderState(user.id)
        if (new URL(request.url).searchParams.get("state") === "1") return NextResponse.json({ state }, { headers })
        if (new URL(request.url).searchParams.get("export") === "1") {
            const comments = await listRecords<Record<string, unknown>>("comments", { userId: user.id })
            return NextResponse.json({ profile: { name: user.name, email: user.email, role: user.role, createdAt: user.createdAt }, reading: state, comments: comments.map(c => ({ articleId: c.articleId, message: c.message, createdAt: c.createdAt, status: c.status })) }, { headers: { ...headers, "Content-Disposition": "attachment; filename=tech-hub-account.json" } })
        }
        const comments = await listRecords<Record<string, unknown>>("comments", { userId: user.id })
        const replies = state.replyNotifications ? await listRecords<Record<string, unknown>>("comments", { replyToUserId: user.id, status: "approved" }) : []
        return NextResponse.json({ state, replies: replies.map(c => ({ id: c.id, articleId: c.articleId, name: c.name, message: c.message, createdAt: c.createdAt })), comments: comments.map(c => ({ id: c.id, articleId: c.articleId, message: c.message, createdAt: c.createdAt, status: c.status })) }, { headers })
    } catch { return NextResponse.json({ error: "Your reading list is temporarily unavailable." }, { status: 503, headers }) }
}
export async function POST(request: Request) {
    try {
        if (!await sameOrigin()) return NextResponse.json({ error: "Invalid origin." }, { status: 403, headers })
        const user = await currentUser()
        if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401, headers })
        if (!await throttle(`reader:${user.id}`, 120)) return NextResponse.json({ error: "Please try again later." }, { status: 429, headers })
        const body = await readJson(request)
        const action = String(body.action || "")
        if (action === "delete-request") {
            await claim("privacy-requests", user.id, { id: user.id, userId: user.id, email: user.email, type: "Account deletion", status: "Requested", createdAt: new Date().toISOString() })
            return NextResponse.json({ message: "Your deletion request is recorded for the site owner. Your account remains active until it is processed." }, { headers })
        }
        if (!["bookmark", "history", "preferences", "clear-history"].includes(action)) return NextResponse.json({ error: "Unknown action." }, { status: 400, headers })
        const articles = action === "clear-history" ? [] : await getAllArticleSummaries()
        const articleId = String(body.articleId || "")
        if (["bookmark", "history"].includes(action) && !articles.some(a => a.id === articleId) && !(action === "bookmark" && body.saved === false)) return NextResponse.json({ error: "Article unavailable." }, { status: 404, headers })
        const availableTopics = new Set(articles.flatMap(a => [a.category, ...(a.tags || [])]))
        const state = await updateReaderState(user.id, value => {
            if (action === "bookmark") {
                value.bookmarks = value.bookmarks.filter(id => id !== articleId)
                if (body.saved === true) value.bookmarks = [articleId, ...value.bookmarks].slice(0, 200)
            }
            if (action === "history" && value.historyEnabled) value.history = [{ articleId, at: new Date().toISOString() }, ...value.history.filter(h => h.articleId !== articleId)].slice(0, 100)
            if (action === "preferences") {
                if (Array.isArray(body.topics)) value.topics = [...new Set(body.topics.filter((t): t is string => typeof t === "string" && availableTopics.has(t)))].slice(0, 30)
                if (typeof body.historyEnabled === "boolean") value.historyEnabled = body.historyEnabled
                if (typeof body.replyNotifications === "boolean") value.replyNotifications = body.replyNotifications
                if (!value.historyEnabled) value.history = []
            }
            if (action === "clear-history") value.history = []
            return value
        })
        return NextResponse.json({ state }, { headers })
    } catch (error) {
        return NextResponse.json({ error: error instanceof Error && "status" in error ? error.message : "Could not save your changes. Try again." }, { status: error instanceof Error && "status" in error ? Number(error.status) : 503, headers })
    }
}
