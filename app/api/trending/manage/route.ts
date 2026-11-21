import { authorized } from "@/lib/accounts"
import { requireAdmin, PRIVATE_RESPONSE_HEADERS } from "@/lib/api"
import { getRecord } from "@/lib/platform-store"
import { signature, hasRequiredSources, SOURCE_POLICY_VERSION } from "@/lib/trending-core.mjs"
import { getSiteUrl } from "@/lib/site"
import type { TrendingFeed } from "@/lib/trending-types"
export const dynamic="force-dynamic"
export async function GET(){
 if(!await authorized("homepage.manage"))return Response.json({error:"Access denied"},{status:403,headers:PRIVATE_RESPONSE_HEADERS})
 const [feed,attempt,health]=await Promise.all([getRecord<TrendingFeed>("trending","feed"),getRecord<{status:string;at:number;policyVersion?:string}>("trending","attempt"),getRecord<{sources:{name:string;status:string;items:number;primary:boolean}[]}>("trending","source-health")])
 return Response.json({policy:SOURCE_POLICY_VERSION,attempt:attempt?{status:attempt.status,at:attempt.at}:null,sources:health?.sources||[],stories:(feed?.stories||[]).filter(s=>Date.parse(s.expiresAt)>Date.now()&&hasRequiredSources(s.sources)).map(s=>({headline:s.headline,sources:s.sources.map(r=>r.name)}))},{headers:PRIVATE_RESPONSE_HEADERS})
}
export async function POST(){
 const denied=await requireAdmin("homepage.manage");if(denied)return denied
 const secret=process.env.ADMIN_SESSION_SECRET,origin=new URL(getSiteUrl())
 if(!secret||origin.protocol!=="https:")return Response.json({error:"Refresh is available on the hosted website."},{status:503})
 const timestamp=String(Date.now())
 try {const r=await fetch(new URL("/.netlify/functions/trending-refresh-background",origin),{method:"POST",redirect:"error",signal:AbortSignal.timeout(10000),headers:{"x-trending-time":timestamp,"x-trending-force":"1","x-trending-signature":signature(secret,timestamp,true)}})
 if(!r.ok)throw Error("Refresh unavailable")
 return Response.json({message:"Refresh requested. Verification runs in the background; repeat requests within 15 minutes are limited."},{status:202,headers:PRIVATE_RESPONSE_HEADERS})
 }catch{return Response.json({error:"Could not request a refresh. The scheduled refresh remains active."},{status:503,headers:PRIVATE_RESPONSE_HEADERS})}
}
