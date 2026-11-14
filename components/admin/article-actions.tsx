"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import type { Article } from "@/lib/types"
import type { Permission } from "@/lib/permissions"
export function ArticleActions({
    article,
    onUpdated,
}: {
    article: Article
    onUpdated: (value: Article) => void
}) {
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    useEffect(() => {
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((d) => setPermissions(d.permissions || []))
    }, [])
    async function patch(value: Partial<Article>) {
        setBusy(true)
        try {
            const r = await fetch(`/api/articles/${article.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(value),
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error)
            onUpdated(d)
            setMessage("")
        } catch (e) {
            setMessage((e as Error).message)
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-3 text-xs">
                <Link
                    className="underline"
                    href={`/admin/preview/${article.id}`}
                    target="_blank"
                >
                    Preview
                </Link>
                {permissions.includes(
                    article.status === "published"
                        ? "articles.unpublish"
                        : "articles.publish"
                ) && (
                    <button
                        disabled={busy}
                        className="underline"
                        onClick={() =>
                            patch({
                                status:
                                    article.status === "published"
                                        ? "draft"
                                        : "published",
                            })
                        }
                    >
                        {article.status === "published"
                            ? "Unpublish"
                            : "Publish"}
                    </button>
                )}
                {permissions.includes("articles.create") && (
                    <button
                        className="underline"
                        disabled={busy}
                        onClick={async () => {
                            setBusy(true)
                            try {
                                const r = await fetch("/api/articles", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                        ...article,
                                        title: `${article.title} (copy)`,
                                        slug: `${article.slug}-copy-${Date.now()}`,
                                        status: "draft",
                                        featured: false,
                                    }),
                                })
                                const d = await r.json()
                                if (!r.ok) throw new Error(d.error)
                                location.assign(`/admin/articles/${d.id}`)
                            } catch (e) {
                                setMessage((e as Error).message)
                                setBusy(false)
                            }
                        }}
                    >
                        Duplicate as draft
                    </button>
                )}
                {article.updatedAt && (
                    <span className="text-muted-foreground">
                        Updated{" "}
                        {new Date(article.updatedAt).toLocaleDateString()}
                    </span>
                )}
            </div>
            {permissions.includes("articles.feature") && (
                <div className="flex flex-wrap items-center gap-3 text-xs">
                    {["homepage", article.section, article.category]
                        .filter((v, i, a) => a.indexOf(v) === i)
                        .map((area) => (
                            <label key={area}>
                                <input
                                    type="checkbox"
                                    className="mr-1"
                                    disabled={busy}
                                    checked={
                                        article.pinnedAreas?.includes(area) ||
                                        false
                                    }
                                    onChange={(e) =>
                                        patch({
                                            pinnedAreas: e.target.checked
                                                ? [
                                                      ...(article.pinnedAreas ||
                                                          []),
                                                      area,
                                                  ]
                                                : article.pinnedAreas?.filter(
                                                      (a) => a !== area
                                                  ),
                                        })
                                    }
                                />
                                Pin: {area}
                            </label>
                        ))}
                    <label>
                        Display order{" "}
                        <input
                            aria-label={`Display order for ${article.title}`}
                            className="w-16 rounded border bg-background p-1"
                            type="number"
                            defaultValue={article.manualOrder || 0}
                            onBlur={(e) => {
                                if (
                                    Number(e.target.value) !==
                                    (article.manualOrder || 0)
                                )
                                    void patch({
                                        manualOrder: Number(e.target.value),
                                    })
                            }}
                        />
                    </label>
                </div>
            )}
            {permissions.includes("articles.publish") && (
                <label className="block text-xs">
                    Sponsorship disclosure (leave empty for independent content)
                    <input
                        className="cms-input max-w-sm"
                        defaultValue={article.sponsorship || ""}
                        maxLength={160}
                        placeholder="Sponsored · Presented by Company"
                        onBlur={(e) => {
                            if (e.target.value !== (article.sponsorship || ""))
                                void patch({ sponsorship: e.target.value })
                        }}
                    />
                </label>
            )}
            {message && (
                <p role="alert" className="text-xs text-red-600">
                    {message}
                </p>
            )}
        </div>
    )
}
