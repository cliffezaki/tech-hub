import Link from "next/link"
import { SafeImage } from "@/components/safe-image"
import { formatDate } from "@/lib/format"
import type { ArticleSummary } from "@/lib/types"
import styles from "./editorial-layout.module.css"
export function EditorialHero({ article, kenya = false, label }: { article: ArticleSummary; kenya?: boolean; label?: string }) {
    return <article className={`${styles.hero} ${kenya ? styles.heroKenya : ""}`}>
        <div className={styles.heroText}>
            <p className="text-xs font-bold uppercase tracking-widest text-white/75">{label || (kenya ? "Kenya in focus" : "The Big Story")} · {article.category}</p>
            <h2 className={styles.heroTitle}><Link href={article.href} className="hover:underline">{article.title}</Link></h2>
            <p className={styles.heroDescription}>{article.excerpt}</p>
            <p className="mt-5 text-xs leading-relaxed text-white/70">{article.author} · <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></p>
            <Link href={article.href} className="mt-6 border-b border-white/60 pb-1 text-sm font-semibold">Read the story <span aria-hidden="true">↗</span><span className="sr-only">: {article.title}</span></Link>
        </div>
        <Link href={article.href} className={styles.heroImage} aria-label={`Read ${article.title}`}>{article.imageUrl && <SafeImage src={article.imageUrl} alt={article.imageAlt || ""} fill priority sizes={kenya ? "(max-width: 899px) 100vw, 60vw" : "(max-width: 899px) 100vw, 50vw"} />}</Link>
    </article>
}
