import {NextResponse} from "next/server"
import {authorized} from "@/lib/accounts"
import {listRecords} from "@/lib/platform-store"
import {getStore} from "@/lib/store"
import {articleVisible} from "@/lib/article-visibility"
export async function GET(){
 if(!(await authorized("analytics.view")))return NextResponse.json({error:"Not authorized"},{status:403})
 try{
 const [events,articles,likes,comments]=await Promise.all([listRecords<{kind:string}>("events"),getStore().listArticles(),listRecords<unknown>("likes"),listRecords<{status:string}>("comments")])
 let subscribers:number|null=null
 if(await authorized("subscribers.manage")){
 const [users,signups]=await Promise.all([listRecords<{email:string;subscribed:boolean}>("users"),listRecords<{email:string}>("subscriptions")])
 subscribers=new Set([...users.filter(u=>u.subscribed),...signups].map(u=>u.email.toLowerCase())).size
 }
 return NextResponse.json({visitors:null,views:events.filter(e=>e.kind==="view").length,articles:articles.filter(articleVisible).length,likes:likes.length,comments:comments.filter(c=>c.status==="approved").length,subscribers},{headers:{"Cache-Control":"no-store"}})
 }catch{return NextResponse.json({error:"Overview data is temporarily unavailable."},{status:503})}
}
