import {NextResponse} from "next/server"
import {authorized} from "@/lib/accounts"
import {listRecords} from "@/lib/platform-store"
import {getStore} from "@/lib/store"
import {articleVisible} from "@/lib/article-visibility"
import {presetRange,previousPeriod,visitorSummary,type VisitorMeasurement} from "@/lib/analytics-report"
export async function GET(){
 if(!(await authorized("analytics.view")))return NextResponse.json({error:"Not authorized"},{status:403})
 try{
 const range=presetRange("30"),previous=previousPeriod(range.start,range.end)
 const [events,articles,likes,comments]=await Promise.all([listRecords<VisitorMeasurement>("events"),getStore().listArticles(),listRecords<{createdAt:string}>("likes"),listRecords<{status:string;createdAt:string}>("comments")])
 const count=(rows:{createdAt:string}[],start:string,end:string)=>rows.filter(r=>r.createdAt?.slice(0,10)>=start&&r.createdAt?.slice(0,10)<=end).length
 const visible=comments.filter(c=>c.status==="approved")
 let subscribers:{createdAt:string}[]|null=null
 if(await authorized("subscribers.manage")){
 const [users,signups]=await Promise.all([listRecords<{email:string;subscribed:boolean;createdAt:string}>("users"),listRecords<{email:string;active?:boolean;createdAt:string}>("subscriptions")])
 const joined=new Map<string,{createdAt:string}>()
 for(const r of [...users.filter(u=>u.subscribed),...signups.filter(s=>s.active!==false)]){const key=r.email.toLowerCase();if(!joined.has(key)||r.createdAt<joined.get(key)!.createdAt)joined.set(key,r)}
 subscribers=[...joined.values()]
 }
 const visitorData=visitorSummary(events,range.start,range.end)
 const values=(start:string,end:string)=>({views:events.filter(e=>e.kind==="view"&&e.at?.slice(0,10)>=start&&e.at?.slice(0,10)<=end).length,likes:count(likes,start,end),comments:count(visible,start,end),subscribers:subscribers?count(subscribers,start,end):null})
 return NextResponse.json({...range,...values(range.start,range.end),visitors:visitorData.count,visitorData,previous:{...values(previous.start,previous.end),visitors:visitorSummary(events,previous.start,previous.end).count},previousRange:previous,articles:articles.filter(articleVisible).length,totalSubscribers:subscribers?.length??null,totalViews:visitorData.audit.totalPageViews},{headers:{"Cache-Control":"no-store"}})
 }catch{return NextResponse.json({error:"Overview data is temporarily unavailable."},{status:503})}
}
