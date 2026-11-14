import "server-only"
import { getStore } from "@/lib/store"
import { getRecord, saveRecord, replaceRecord, platformReady } from "@/lib/platform-store"
import { legacyPlacements, PLACEMENTS, placementAllowed, placementLabel } from "@/lib/placements"
import { articleVisible } from "@/lib/article-visibility"
import type { Article } from "@/lib/types"
export type PlacementState = {recordVersion?:number;pins:Record<string,string[]>;previousLead?:string;lastLead?:string}
export function chooseLead(articles:Article[],state:PlacementState) {
 const visible=articles.filter(articleVisible).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))
 return visible.find(a=>state.pins[a.id]?.includes("homepage")) || visible.find(a=>state.pins[a.id]?.includes("homepage:featured")) || visible[0]
}
export async function readPlacements(articles?:Article[]):Promise<PlacementState> {
 if(platformReady()) {const existing=await getRecord<PlacementState>("editorial","placements");if(existing) return existing}
 const all=articles || await getStore().listArticles(true)
 const pins=Object.fromEntries(all.map(a=>[a.id,legacyPlacements(a)]))
 const settings=await getStore().getSettings()
 if(settings.heroArticleId && pins[settings.heroArticleId]) {
  for(const id of Object.keys(pins)) pins[id]=pins[id].filter(p=>p!=="homepage")
  pins[settings.heroArticleId].push("homepage")
 }
 return {pins}
}
export function withPlacements(a:Article,state:PlacementState):Article {return {...a,pinnedAreas:state.pins[a.id] || [],featured:!!state.pins[a.id]?.includes("homepage:featured")}}
export async function preparePlacements(id:string,body:Record<string,unknown>,section:string) {
 if(!Array.isArray(body.pinnedAreas) && body.featured === undefined) return null
 const articles=await getStore().listArticles(true)
 const previous=await readPlacements(articles)
 const old=previous.pins[id] || []
 const requested=Array.isArray(body.pinnedAreas) ? body.pinnedAreas : old
 let selected=[...new Set(requested.filter((v):v is string=>typeof v === "string"))]
 if(body.featured === false && !Array.isArray(body.pinnedAreas)) selected=selected.filter(v=>v!=="homepage:featured")
 if(body.featured === true && !selected.includes("homepage:featured")) selected.push("homepage:featured")
 if(selected.some(v=>!PLACEMENTS.some(p=>p.id===v))) throw Error("Unknown featured placement")
 selected=selected.filter(v=>placementAllowed(v,section))
 // One article can never occupy both homepage single-story slots.
 if(selected.includes("homepage") && selected.includes("homepage:also")) selected=selected.filter(v=>v!=="homepage:also")
 if(JSON.stringify([...old].sort()) === JSON.stringify([...selected].sort()) && body.status === undefined && body.publishedAt === undefined) return null
 const conflicts=PLACEMENTS.filter(p=>p.single && selected.includes(p.id) && !old.includes(p.id)).flatMap(p=>Object.entries(previous.pins).filter(([other,pins])=>other!==id && pins.includes(p.id)).map(([other])=>({placement:p.id,articleId:other,title:articles.find(a=>a.id===other)?.title || "another article"})))
 const signature=JSON.stringify(conflicts)
 if(conflicts.length && body.confirmPlacements !== signature) return {conflict:{error:`Replace ${conflicts.map(c=>`“${c.title}” in ${placementLabel(c.placement)}`).join(", ")}?`,confirmPlacements:signature}}
 const pins=Object.fromEntries(Object.entries(previous.pins).map(([other,list])=>[other,other===id ? selected : list.filter(v=>!selected.includes(v) || !PLACEMENTS.find(p=>p.id===v)?.single)]))
 pins[id]=selected
 return {previous,next:{...previous,pins},articles}
}
export async function commitPlacements(plan:Awaited<ReturnType<typeof preparePlacements>>,article:Article) {
 if(!plan || "conflict" in plan) return
 const before=chooseLead(plan.articles,plan.previous)
 const after=chooseLead([...plan.articles.filter(a=>a.id!==article.id),article],plan.next)
 if(before && after && before.id!==after.id) plan.next.previousLead=before.id
 if(after) plan.next.lastLead=after.id
 const existing=await getRecord<PlacementState>("editorial","placements")
 if(existing) await replaceRecord("editorial","placements",plan.previous,plan.next)
 else await saveRecord("editorial","placements",plan.next,true)
}
