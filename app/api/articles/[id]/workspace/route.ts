import { NextResponse } from "next/server"
import { createHash, randomUUID } from "node:crypto"
import { currentUser, userPermissions } from "@/lib/accounts"
import { requireAdmin } from "@/lib/api"
import { getStore } from "@/lib/store"
import { getRecord, saveRecord, listRecords } from "@/lib/platform-store"
import { editorFields } from "@/lib/editor-fields"
type Context = { params: Promise<{ id: string }> }
type Snapshot = { id: string; articleId: string; userId: string; savedAt: string; data: Record<string, unknown> }
async function access(id: string) {
    const user = await currentUser()
    if (!user) return null
    const p = await userPermissions(user)
    if (id.startsWith("new-") && p.includes("articles.create")) return user
    const a = await getStore().getArticle(id)
    return a && (p.includes("articles.editAll") || (p.includes("articles.editOwn") && a.ownerId === user.id)) ? user : null
}
const key = (id: string, user: string) => createHash("sha256").update(`${id}:${user}`).digest("hex")
export async function GET(request: Request, { params }: Context) {
    const { id } = await params; const user = await access(id)
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    const revision = new URL(request.url).searchParams.get("revision")
    if (revision) {
        if (!/^[a-f0-9-]{36}$/.test(revision)) return NextResponse.json({ error: "Not found" }, { status: 404 })
        const record = await getRecord<Snapshot>("article-revisions", revision)
        if (!record || record.articleId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 })
        return NextResponse.json(record, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } })
    }
    const workspace = await getRecord<Snapshot>("article-working-drafts", key(id, user.id))
    const revisions = (await listRecords<Snapshot>("article-revisions")).filter(r => r.articleId === id).sort((a, b) => b.savedAt.localeCompare(a.savedAt)).slice(0, 50).map(r => ({ id: r.id, savedAt: r.savedAt, data: { title: r.data.title } }))
    return NextResponse.json({ workspace, revisions }, { headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } })
}
export async function PUT(request: Request, { params }: Context) {
    const denied = await requireAdmin("articles.create");
    // Editors without creation permission may still save existing articles.
    if (denied) { const editDenied = await requireAdmin("articles.editOwn"); if (editDenied) return editDenied }
    const { id } = await params; const user = await access(id)
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 })
    try {
        const body = await request.json()
        if (JSON.stringify(body).length > 1100000) throw new Error("Draft is too large.")
        const fields = editorFields(body)
        const data = { ...body, ...fields }
        const record = { id: randomUUID(), articleId: id, userId: user.id, savedAt: new Date().toISOString(), data }
        await saveRecord("article-working-drafts", key(id, user.id), record)
        if (body.checkpoint === true) await saveRecord("article-revisions", record.id, record, true)
        return NextResponse.json({ savedAt: record.savedAt })
    } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 400 }) }
}
