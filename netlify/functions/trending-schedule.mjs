import { signature } from "../../lib/trending-core.mjs"

export default async (_request, context) => {
    const secret=Netlify.env.get("ADMIN_SESSION_SECRET")
    if(!secret||!Netlify.env.get("SUPABASE_URL")) {
        console.log("Trending refresh awaits storage configuration.")
        return
    }
    const timestamp=String(Date.now())
    const origin=new URL(context.site.url)
    if(origin.protocol!=="https:")throw new Error("HTTPS site URL required")
    const response=await fetch(new URL("/.netlify/functions/trending-refresh-background",origin),{method:"POST",redirect:"error",signal:AbortSignal.timeout(10000),headers:{"x-trending-time":timestamp,"x-trending-signature":signature(secret,timestamp)}})
    if(!response.ok)throw new Error("Could not start trending refresh")
}
// Run every four hours (UTC); unchanged source evidence skips AI generation.
export const config = { schedule: "0 */4 * * *" }
