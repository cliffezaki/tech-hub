"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, ImageIcon, Loader2, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SafeImage } from "@/components/safe-image"
import { formatDate, formatFileSize } from "@/lib/format"
import type { MediaItem } from "@/lib/types"

export default function AdminMediaPage() {
    const fileInput = useRef<HTMLInputElement>(null)
    const [media, setMedia] = useState<MediaItem[]>([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")
    const [copiedId, setCopiedId] = useState("")

    useEffect(() => {
        fetch("/api/media")
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) setMedia(data)
            })
            .catch(() => setError("Could not load the media library."))
            .finally(() => setLoading(false))
    }, [])

    const handleUpload = async (files: FileList) => {
        setUploading(true)
        setError("")

        try {
            for (const file of Array.from(files)) {
                const formData = new FormData()
                formData.append("file", file)

                const response = await fetch("/api/media", { method: "POST", body: formData })
                const data = await response.json().catch(() => ({}))

                if (!response.ok) {
                    setError(data.error || "Upload failed.")
                    continue
                }

                setMedia((current) => [data, ...current])
            }
        } finally {
            setUploading(false)
            if (fileInput.current) {
                fileInput.current.value = ""
            }
        }
    }

    const handleDelete = async (item: MediaItem) => {
        if (!confirm(`Delete ${item.filename}?`)) return

        const response = await fetch(`/api/media?id=${encodeURIComponent(item.id)}`, { method: "DELETE" })

        if (!response.ok) {
            const data = await response.json().catch(() => ({}))
            setError(data.error || "Could not delete that image.")
            return
        }

        setMedia((current) => current.filter((entry) => entry.id !== item.id))
    }

    const copyUrl = async (item: MediaItem) => {
        await navigator.clipboard.writeText(item.url)
        setCopiedId(item.id)
        setTimeout(() => setCopiedId(""), 1500)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Media</h1>
                    <p className="text-muted-foreground">Upload images once and reuse them across articles.</p>
                </div>
                <Button disabled={uploading} onClick={() => fileInput.current?.click()}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    Upload images
                </Button>
            </div>

            <input
                ref={fileInput}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(event) => {
                    if (event.target.files?.length) handleUpload(event.target.files)
                }}
            />

            {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            ) : media.length === 0 ? (
                <Card className="p-10 text-center">
                    <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/40" />
                    <h3 className="mt-3 font-semibold">No images uploaded yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Upload photos here, then pick them when writing an article.
                    </p>
                </Card>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {media.map((item) => (
                        <Card key={item.id} className="overflow-hidden">
                            <div className="relative aspect-video bg-muted">
                                <SafeImage src={item.url} alt={item.filename} fill className="object-cover" />
                            </div>
                            <div className="space-y-3 p-4">
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{item.filename}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(item.uploadedAt)}
                                        {item.size ? ` · ${formatFileSize(item.size)}` : ""}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => copyUrl(item)}>
                                        {copiedId === item.id ? (
                                            <Check className="mr-2 h-4 w-4" />
                                        ) : (
                                            <Copy className="mr-2 h-4 w-4" />
                                        )}
                                        {copiedId === item.id ? "Copied" : "Copy URL"}
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={() => handleDelete(item)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
