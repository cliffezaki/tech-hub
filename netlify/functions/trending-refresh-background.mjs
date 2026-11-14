import { authenticated } from "../../lib/trending-core.mjs"
import { refreshFeed } from "../../lib/trending-worker.mjs"

export default async request => {
    const get=key=>Netlify.env.get(key)
    if(!authenticated(request,get("ADMIN_SESSION_SECRET")))return
    const env=Object.fromEntries(["OPENAI_API_KEY","TRENDING_AI_MODEL","SUPABASE_URL","SUPABASE_SECRET_KEY"].map(key=>[key,get(key)]))
    try {console.log("Trending refresh",JSON.stringify(await refreshFeed(env)))}
    catch {console.error("Trending refresh failed; recent cached briefings retained.")}
}
export const config = { background: true }
