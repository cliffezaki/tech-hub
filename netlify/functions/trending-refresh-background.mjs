import { refreshKenya } from "../../lib/kenya-briefings.mjs"
import process from "node:process"
import { authenticated } from "../../lib/trending-core.mjs"
import { refreshFeed } from "../../lib/trending-worker.mjs"

export default async request => {
    const get=key=>Netlify.env.get(key)||process.env[key]
    if(!authenticated(request,get("ADMIN_SESSION_SECRET")))return
    const env=Object.fromEntries(["OPENAI_API_KEY","TRENDING_AI_MODEL","OPENAI_BASE_URL","SUPABASE_URL","SUPABASE_SECRET_KEY"].map(key=>[key,get(key)]))
    env.useGateway=true
    env.force=request.headers.get("x-trending-force")==="1"
    const runs=await Promise.allSettled([refreshFeed(env),refreshKenya(env)])
    for (const [index,result] of runs.entries()) console.log(index===0?"Trending refresh":"Kenya refresh",result.status==="fulfilled"?result.value || "checked":"failed; retained previous feed")
}
export const config = { background: true }

