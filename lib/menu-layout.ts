import { ARTICLE_SECTIONS, SECTION_META, type PageContent } from "./types"
export const MENU_NAMES = { main: "Header & hamburger", sections: "Footer — Sections", footer: "Footer — More" } as const
export type MenuName = keyof typeof MENU_NAMES
export type MenuItem = { id: string; name: string; href: string; menu: MenuName; hidden?: boolean; order?: number }
export type MenuLayout = { revision: string; pageOrder: string[]; items: MenuItem[] }
export const pinned = (item: MenuItem) => item.menu === "footer" && ["/search", "/account"].includes(item.href)
export function localPath(value: unknown): string {
    const path = String(value || "").trim()
    let decoded: string
    try { decoded = decodeURIComponent(path) } catch { throw new Error("Use a valid website path.") }
    if (!/^\/(?!\/)/.test(decoded) || /[\\\s\u0000-\u001f]/.test(decoded) || /^\/(admin|api|studio)(\/|$)/.test(decoded)) throw new Error("Use a website path such as /about, not an external URL or admin page.")
    return path
}
export function orderedPages(pages: PageContent[], order: string[]) {
    const rank = new Map(order.map((slug, i) => [slug, i]))
    return [...pages].sort((a, b) => (rank.get(a.slug) ?? order.length) - (rank.get(b.slug) ?? order.length))
}
export function defaults(pages: PageContent[]): MenuItem[] {
    const items: MenuItem[] = [{ id: "main-home", name: "Home", href: "/", menu: "main" }]
    const add = (menu: MenuName, slug: string, name: string) => items.push({ id: `${menu}-${slug}`, name, href: `/${slug}`, menu })
    for (const s of ARTICLE_SECTIONS) {
        add("main", s, SECTION_META[s].navLabel)
        add("sections", s, SECTION_META[s].label)
    }
    for (const slug of ["about", "contact", "advertise"]) {
        const page = pages.find(p => p.slug === slug)
        if (page?.status === "published") add("main", slug, slug === "about" ? "About" : slug === "contact" ? "Contact" : page.title)
    }
    for (const page of pages.filter(p => p.status === "published" && !ARTICLE_SECTIONS.includes(p.slug as typeof ARTICLE_SECTIONS[number]) && !["about", "contact", "advertise"].includes(p.slug))) add("main", page.slug, page.title)
    for (const page of pages.filter(p => p.status === "published" && !ARTICLE_SECTIONS.includes(p.slug as typeof ARTICLE_SECTIONS[number]) && p.slug !== "contact")) add("footer", page.slug, page.title)
    add("footer", "contact", "Contact")
    add("footer", "search", "Search")
    add("footer", "account", "Log in / Sign up")
    return items
}
export function resolveLayout(pages: PageContent[], saved: MenuLayout | null, legacy: MenuItem[] = []): MenuLayout {
    let items = defaults(pages)
    for (const item of [...legacy.sort((a,b) => Number(a.order || 0) - Number(b.order || 0)), ...(saved?.items || [])]) {
        if (!(item.menu in MENU_NAMES)) continue
        try { localPath(item.href) } catch { continue }
        items = items.filter(i => !(i.id === item.id || (i.menu === item.menu && i.href === item.href)))
        items.push({ ...item, name: String(item.name).slice(0,100) })
    }
    // Saving a full layout retains its order; new pages append without resetting custom choices.
    if (saved) items.sort((a,b) => {
        const rank = (i: MenuItem) => { const n = saved.items.findIndex(s => s.id === i.id); return n < 0 ? saved.items.length : n }
        return rank(a) - rank(b)
    })
    items = [...items.filter(i => !pinned(i)), ...items.filter(pinned).sort((a,b) => a.href === "/search" ? -1 : b.href === "/search" ? 1 : 0).map(i => ({ ...i, hidden:false }))]
    const pageOrder = orderedPages(pages, saved?.pageOrder || []).map(p => p.slug)
    return { revision: saved?.revision || "initial", pageOrder, items }
}
export function publicItems(layout: MenuLayout, pages: PageContent[]) {
    return layout.items.filter(item => {
        const slug = item.href.slice(1).split(/[?#]/)[0]
        const page = pages.find(p => p.slug === slug)
        return !page || page.status === "published"
    })
}
export function movePage(layout: MenuLayout, slug: string, direction: number): MenuLayout {
    const order = [...layout.pageOrder], index = order.indexOf(slug), next = index + direction
    if (![-1,1].includes(direction) || index < 0 || next < 0 || next >= order.length) throw new Error("This page cannot move further in that direction.")
    ;[order[index],order[next]] = [order[next],order[index]]
    const rank = new Map(order.map((s,i) => [`/${s}`,i]))
    const items = [...layout.items]
    for (const menu of Object.keys(MENU_NAMES)) {
        const positions = items.flatMap((item,i) => item.menu === menu && rank.has(item.href) ? [i] : [])
        const links = positions.map(i => items[i]).sort((a,b) => rank.get(a.href)! - rank.get(b.href)!)
        positions.forEach((position,i) => { items[position] = links[i] })
    }
    return { ...layout, pageOrder: order, items }
}
export function moveLink(layout: MenuLayout, id: string, direction: number): MenuLayout {
    const selected = layout.items.find(i => i.id === id)
    if (!selected || pinned(selected) || ![-1,1].includes(direction)) throw new Error("This link cannot be reordered.")
    const positions = layout.items.flatMap((i,n) => i.menu === selected.menu && !pinned(i) ? [n] : [])
    const index = positions.findIndex(n => layout.items[n].id === id), next = index + direction
    if (next < 0 || next >= positions.length) throw new Error("This link cannot move further in that direction.")
    const items = [...layout.items], a = positions[index], b = positions[next]
    ;[items[a], items[b]] = [items[b], items[a]]
    return { ...layout, items }
}
