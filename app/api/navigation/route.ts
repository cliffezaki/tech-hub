import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { authorized, audit, sameOrigin } from "@/lib/accounts"
import { claim, deleteRecord, saveRecord } from "@/lib/platform-store"
import { readNavigation } from "@/lib/navigation"
import { localPath, MENU_NAMES, moveLink, movePage, pinned, resolveLayout, type MenuName } from "@/lib/menu-layout"
import { revalidateSite } from "@/lib/api"
const respond = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control":"no-store", Vary:"Cookie" } })
export async function GET() {
    if (!(await authorized("menus.manage")) && !(await authorized("pages.manage"))) return respond({error:"Not authorized"},403)
    try { return respond((await readNavigation()).layout) } catch { return respond({error:"Could not load menus."},503) }
}
export async function POST(request: Request) {
    let locked = false
    try {
        if (!(await sameOrigin())) return respond({error:"Invalid origin"},403)
        const body = await request.json()
        const actor = await authorized(body.action === "movePage" ? "pages.manage" : "menus.manage")
        if (!actor) return respond({error:"Not authorized"},403)
        locked = await claim("locks","navigation-layout",{at:Date.now()})
        if (!locked) return respond({error:"Another menu change is being saved. Please try again."},409)
        const navigation = await readNavigation()
        let { layout } = navigation
        if (body.revision !== layout.revision) return respond({error:"Menus changed in another window. Refresh before saving."},409)
        if (body.action === "movePage") layout = movePage(layout,String(body.slug),Number(body.direction))
        else if (body.action === "moveLink") layout = moveLink(layout,String(body.id),Number(body.direction))
        else if (body.action === "saveLink") {
            const previous = layout.items.find(i => i.id === body.id)
            if (previous && pinned(previous)) throw new Error("Search and account links stay together at the end of More.")
            const name = String(body.name || "").trim().slice(0,100), href = localPath(body.href)
            const menu = String(body.menu) as MenuName
            if (!name || !(menu in MENU_NAMES)) throw new Error("Choose a label and menu.")
            if (layout.items.some(i => i.id !== previous?.id && i.menu === menu && i.href === href)) throw new Error("This link is already in that menu.")
            const item = {id: previous?.id || randomUUID(),name,href,menu,hidden:body.hidden === true}
            layout = { ...layout, items: [...layout.items.filter(i => i.id !== item.id),item] }
            if (previous?.menu === menu) {
                const oldIndex = navigation.layout.items.findIndex(i => i.id === item.id)
                layout.items.pop(); layout.items.splice(oldIndex,0,item)
            }
        } else throw new Error("Unknown menu action.")
        layout.revision = randomUUID()
        layout = resolveLayout(navigation.pages,layout)
        await saveRecord("config","navigation-layout",layout)
        await audit(actor.id,"navigation.reorder",String(body.slug || body.id || "menus"))
        revalidateSite()
        return respond(layout)
    } catch (e) { return respond({error:e instanceof Error ? e.message : "Could not save menus."},400) }
    finally { if (locked) await deleteRecord("locks","navigation-layout") }
}
