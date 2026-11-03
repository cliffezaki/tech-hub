import Link from "next/link"
import { SafeImage } from "@/components/safe-image"
import type { ArticleSummary } from "@/lib/types"

export function EditorialBanner({ articles }: { articles: ArticleSummary[] }) {
    const [lead, ...supporting] = articles
    if (!lead) return null
    return <section aria-label="In focus" className="my-8 overflow-hidden rounded-xl bg-[#14191f] text-white">
        <div className="relative min-h-64 sm:min-h-96">
            {lead.imageUrl && <SafeImage src={lead.imageUrl} alt={lead.imageAlt || ""} fill priority sizes="(max-width: 1280px) 100vw, 1200px" className="object-cover" />}
            <div className="relative bg-gradient-to-t from-black/90 via-black/60 to-black/10 px-6 pb-8 pt-24 sm:px-10 sm:pt-40">
                <p className="kicker text-white/80">In focus · {lead.category}</p>
                <h2 className="mt-3 max-w-3xl text-3xl font-bold leading-tight sm:text-4xl"><Link href={lead.href} className="hover:underline focus-visible:outline-2">{lead.title}</Link></h2>
                <p className="mt-3 max-w-2xl line-clamp-3 leading-relaxed text-white/85">{lead.excerpt}</p>
                <Link href={lead.href} className="mt-5 inline-block border-b border-white/60 pb-1 text-sm font-semibold">Read more <span aria-hidden="true">↗</span><span className="sr-only">: {lead.title}</span></Link>
            </div>
        </div>
        {supporting.length > 0 && <div className="grid divide-y divide-white/20 border-t border-white/20 sm:grid-cols-3 sm:divide-x sm:divide-y-0">{supporting.slice(0, 3).map(article => <Link href={article.href} key={article.id} className="p-6 transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-[-4px] sm:p-8"><p className="mb-2 text-xs uppercase tracking-widest text-white/60">{article.category}</p><h3 className="text-lg font-semibold leading-snug">{article.title}</h3></Link>)}</div>}
    </section>
}
