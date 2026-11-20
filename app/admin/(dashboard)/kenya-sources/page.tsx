import { currentUser } from "@/lib/accounts"
import { kenyaFeed } from "@/lib/kenya-feed"
import { notFound } from "next/navigation"
export default async function KenyaSources() {
    const user=await currentUser()
    if(!user || !["owner","administrator"].includes(user.role)) notFound()
    return <section><h1>Kenya briefing sources</h1>{(await kenyaFeed()).map(s=><article key={s.id} className="border-b py-4"><h2>{s.headline}</h2>{s.sources.map(ref=><a key={ref.url} className="mr-4 underline" href={ref.url}>{ref.name}</a>)}</article>)}</section>
}
