import { notFound } from "next/navigation"
import { getPublishedPage } from "@/lib/content"
import { Markdown } from "@/components/markdown"
import { AdvertisingInquiry } from "@/components/advertising-inquiry"
import { getRecord, listRecords, platformReady } from "@/lib/platform-store"
import type { RecordData } from "@/lib/modules"
import type { User } from "@/lib/permissions"
export const dynamic = "force-dynamic"
export default async function Advertise() {
    const page = await getPublishedPage("advertise")
    if (!page) notFound()
    const packages = platformReady()
        ? (await listRecords<RecordData>("packages")).filter((p) => p.available)
        : []
    const settings = platformReady()
        ? await getRecord<RecordData>("config", "advertising")
        : null
    const since = new Date(new Date().getTime() - 30 * 86400000).toISOString()
    const views = settings?.showViews
        ? (await listRecords<{ kind: string; at: string }>("events")).filter(
              (e) => e.kind === "view" && e.at >= since
          ).length
        : null
    const subscribers = settings?.showSubscribers
        ? (await listRecords<User>("users")).filter((u) => u.subscribed).length
        : null
    return (
        <div className="site-container py-14">
            <header className="max-w-3xl">
                <p className="kicker text-brand-red">Brand partnerships</p>
                <h1 className="mt-4 text-4xl font-black md:text-6xl">
                    {page.title}
                </h1>
                <p className="mt-5 text-xl text-muted-foreground">
                    {page.excerpt}
                </p>
                <a className="cms-primary mt-7" href="#inquiry">
                    Let’s discuss your campaign
                </a>
            </header>
            <div className="my-12 grid gap-10 lg:grid-cols-[2fr_1fr]">
                <Markdown content={page.content} />
                <aside className="space-y-5">
                    <div className="rounded-xl border bg-muted/20 p-6">
                        <h2 className="text-xl font-bold">Audience & reach</h2>
                        {views !== null && (
                            <p className="mt-3">
                                {views.toLocaleString()} measured page views in
                                the past 30 days
                            </p>
                        )}
                        {subscribers !== null && (
                            <p className="mt-3">
                                {subscribers.toLocaleString()} subscribed
                                accounts
                            </p>
                        )}
                        {views === null && subscribers === null && (
                            <p className="mt-3 text-muted-foreground">
                                Contact us for currently available audience
                                information.
                            </p>
                        )}
                    </div>
                    {settings?.mediaKit &&
                        /^(https?:\/\/|\/(?!\/))/.test(
                            String(settings.mediaKit)
                        ) && (
                            <a
                                href={String(settings.mediaKit)}
                                className="cms-primary"
                                target="_blank"
                                rel="noreferrer"
                            >
                                Download media kit
                            </a>
                        )}
                    {packages.map((p) => (
                        <div className="rounded-xl border p-6" key={p.id}>
                            <h2 className="text-xl font-bold">{p.name}</h2>
                            <p className="mt-3">{p.description}</p>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {p.placements} · {p.duration}
                            </p>
                            {p.publicPrice && (
                                <p className="mt-4 font-semibold">
                                    {p.currency} {p.price}
                                </p>
                            )}
                        </div>
                    ))}
                </aside>
            </div>
            <section id="inquiry" className="scroll-mt-24">
                <h2 className="mb-6 text-3xl font-bold">
                    Tell us what you have in mind
                </h2>
                <AdvertisingInquiry />
            </section>
        </div>
    )
}
