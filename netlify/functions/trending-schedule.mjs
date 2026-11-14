import { signature } from "../../lib/trending-core.mjs"

export default async (_request, context) => {
    const secret=Netlify.env.get("ADMIN_SESSION_SECRET")
    if(!secret||!Netlify.env.get("OPENAI_API_KEY")||!Netlify.env.get("TRENDING_AI_MODEL")) {
        console.log("Trending refresh awaits server-side AI configuration.")
        return
    }
    const timestamp=String(Date.now())
    const origin=new URL(context.site.url)
    if(origin.protocol!=="https:")throw new Error("HTTPS site URL required")
    const response=await fetch(new URL("/.netlify/functions/trending-refresh-background",origin),{method:"POST",redirect:"error",signal:AbortSignal.timeout(10000),headers:{"x-trending-time":timestamp,"x-trending-signature":signature(secret,timestamp)}})
    if(!response.ok)throw new Error("Could not start trending refresh")
}
// Every two hours, UTC. Runs on the published deployment, without visitors.
export const config = { schedule: "0 */2 * * *" }
