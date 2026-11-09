"use client"

import { useState } from "react"
import Link from "next/link"
import { Pause, Play } from "lucide-react"
import type { ArticleSummary } from "@/lib/types"
import styles from "./news-ticker.module.css"

export function NewsTicker({ articles }: { articles: ArticleSummary[] }) {
    const [paused, setPaused] = useState(false)

    if (articles.length < 2) return null

    return (
        <aside aria-label="Recent headlines" className={styles.ticker}>
            <span className={styles.label}>The latest</span>
            <div className={styles.window}>
                <div className={`${styles.track} ${paused ? styles.paused : ""}`}>
                    {[0, 1].map((copy) => (
                        <div
                            key={copy}
                            className={styles.group}
                            aria-hidden={copy === 1 ? true : undefined}
                        >
                            {articles.map((article) => (
                                <Link
                                    key={article.id}
                                    href={article.href}
                                    tabIndex={copy === 1 ? -1 : undefined}
                                >
                                    {article.title}
                                    <span aria-hidden="true"> · </span>
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
            <button
                type="button"
                className={styles.control}
                onClick={() => setPaused(!paused)}
                aria-label={paused ? "Play headline ticker" : "Pause headline ticker"}
                aria-pressed={paused}
            >
                {paused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
            </button>
        </aside>
    )
}
