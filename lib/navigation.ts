import "server-only"
import { getStore } from "./store"
import { mergeBuiltinPages } from "./builtin-pages"
import { getRecord, listRecords, platformReady } from "./platform-store"
import { resolveLayout, type MenuItem, type MenuLayout } from "./menu-layout"
import type { PageContent } from "./types"
export async function readNavigation(pages?: PageContent[]) {
    const allPages = pages || mergeBuiltinPages(await getStore().listPages(true))
    const [saved, legacy] = platformReady() ? await Promise.all([
        getRecord<MenuLayout>("config", "navigation-layout"), listRecords<MenuItem>("navigation"),
    ]) : [null, []]
    return { pages: allPages, layout: resolveLayout(allPages, saved, legacy) }
}
