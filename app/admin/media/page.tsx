'use client'

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { ImageIcon, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Article } from "@/lib/types"

export default function MediaLibraryPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch("/api/articles")
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) {
                    setArticles(data)
                }
            })
            .finally(() => setLoading(false))
    }, [])

    const mediaItems = useMemo(() => {
        const unique = new Map<string, Article>()

        for (const article of articles) {
            if (article.imageUrl && !unique.has(article.imageUrl)) {
                unique.set(article.imageUrl, article)
            }
        }

        return Array.from(unique.entries()).map(([url, article]) => ({ url, article }))
    }, [articles])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="container mx-auto max-w-6xl px-4 py-12">
            <div className="mb-8">
                <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Media Library</h1>
                <p className="text-muted-foreground">
                    Images currently used by your posts. Paste any image URL into a post to reuse it.
                </p>
            </div>

            {mediaItems.length === 0 ? (
                <Card className="border-dashed bg-muted/50 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                        <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                        <h3 className="text-lg font-semibold">No images yet</h3>
                        <p className="text-muted-foreground">Add an image URL to a post and it will show up here.</p>
                    </div>
                </Card>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {mediaItems.map(({ url, article }) => (
                        <Card key={url} className="overflow-hidden">
                            <div className="relative aspect-video bg-muted">
                                <Image src={url} alt={article.title} fill unoptimized className="object-cover" />
                            </div>
                            <div className="space-y-3 p-4">
                                <div>
                                    <h3 className="line-clamp-1 font-semibold">{article.title}</h3>
                                    <p className="text-xs uppercase tracking-wider text-muted-foreground">{article.section}</p>
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => navigator.clipboard.writeText(url)}
                                >
                                    Copy Image URL
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
