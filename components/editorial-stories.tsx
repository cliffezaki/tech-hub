import Link from "next/link"
import { SafeImage } from "@/components/safe-image"
import { formatDate } from "@/lib/format"
import type { ArticleSummary } from "@/lib/types"
import styles from "./editorial-layout.module.css"

export function EditorialGrid({ articles }: { articles: ArticleSummary[] }) {
    return <div className={styles.grid}>{articles.map(article => <article key={article.id}>
        <Link href={article.href} className={`${styles.story} group`}>
            <div className={styles.image}>{article.imageUrl && <SafeImage src={article.imageUrl} alt={article.imageAlt || ""} fill sizes="(max-width: 639px) 100vw, (max-width: 1099px) 50vw, 25vw" />}</div>
            <p className={styles.category}>{article.category}</p>
            <h3 className={styles.headline}><span className="headline-link">{article.title}</span></h3>
            <p className={styles.summary}>{article.excerpt}</p>
            <p className={styles.meta}>{article.author}<span aria-hidden="true"> · </span><time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time></p>
        </Link>
    </article>)}</div>
}

export function ReviewStrip({ articles }: { articles: ArticleSummary[] }) {
    return <div className={styles.strip}>{articles.map(article => <article key={article.id} className={styles.stripItem}>
        <Link href={article.href} className={`${styles.reviewLink} group`}><div><p className={styles.stripLabel}>{article.category}</p><h3 className={styles.reviewTitle}><span className="headline-link">{article.title}</span></h3></div>
            <div className={styles.reviewImage}>{article.imageUrl && <SafeImage src={article.imageUrl} alt={article.imageAlt || ""} fill sizes="72px" />}</div>
        </Link>
    </article>)}</div>
}

export function HeadlineStrip({ articles }: { articles: ArticleSummary[] }) {
    return <div className={styles.headlineStrip}>{articles.map(article => <article key={article.id}><Link href={article.href} className="group"><h3><span className="headline-link">{article.title}</span></h3><p>{article.author}</p></Link></article>)}</div>
}
