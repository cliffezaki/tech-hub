import { ARTICLE_SECTIONS, SECTION_META, type Article } from "@/lib/types"
export const PLACEMENTS = [
 {id:"homepage", page:"Homepage", label:"Today's Highlight", single:true},
 {id:"homepage:also", page:"Homepage", label:"Also Worth Reading", single:true},
 {id:"homepage:featured", page:"Homepage", label:"Featured Articles", single:false},
 {id:"homepage:reviews", page:"Homepage", label:"Reviews", single:false},
 {id:"news:featured", page:"News", label:"Featured News", single:true},
 {id:"news:latest", page:"News", label:"Latest Stories", single:false},
 {id:"reviews:featured", page:"Reviews", label:"Featured Reviews", single:true},
 {id:"reviews:latest", page:"Reviews", label:"Latest Reviews", single:false},
 ...ARTICLE_SECTIONS.filter(s => !["news","reviews"].includes(s)).map(s => ({id:`${s}:latest`,page:SECTION_META[s].label,label:s === "tech-kenya" ? "Featured Story" : "Articles",single:s === "tech-kenya"})),
]
export function legacyPlacements(a: Pick<Article,"pinnedAreas"|"featured"|"section"|"category">) {
 const result = (a.pinnedAreas || []).map(id => PLACEMENTS.some(p=>p.id===id) ? id : id === a.section || id === a.category ? `${a.section}:latest` : "").filter(Boolean)
 if(a.featured) result.push("homepage:featured")
 return [...new Set(result)]
}
export function placementAllowed(id:string,section:string) {
 return id.startsWith("homepage") ? id !== "homepage:reviews" || section === "reviews" : id.startsWith(`${section}:`)
}
export function placementLabel(id:string) {const p=PLACEMENTS.find(p=>p.id===id);return p ? `${p.page} · ${p.label}` : id}
export function pinnedFirst<T extends {pinnedAreas?:string[];publishedAt:string}>(articles:T[],id:string) {
 return [...articles].sort((a,b)=>Number(!!b.pinnedAreas?.includes(id))-Number(!!a.pinnedAreas?.includes(id)) || Date.parse(b.publishedAt)-Date.parse(a.publishedAt))
}
