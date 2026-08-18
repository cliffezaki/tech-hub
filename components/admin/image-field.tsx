"use client"

import { useEffect, useRef, useState } from "react"
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SafeImage } from "@/components/safe-image"
import type { MediaItem } from "@/lib/types"

interface ImageFieldProps {
    value?: string
    onChange: (url: string) => void
    label?: string
}

/**
 * Upload a file, pick one already in the library, or paste a URL — all three write the
 * same plain image URL back into the article, so the storage driver stays interchangeable.
 */
export function ImageField({ value, onChange, label = "Featured image" }: ImageFieldProps) {
    const fileInput = useRef<HTMLInputElement>(null)
    const [library, setLibrary] = useState<MediaItem[]>([])
    const [showLibrary, setShowLibrary] = useState(false)
    const [uploading, setUploading] = useState(false)
    const [error, setError] = useState("")

    useEffect(() => {
        fetch("/api/media")
            .then((response) => response.json())
            .then((data) => {
                if (Array.isArray(data)) setLibrary(data)
            })
            .catch(() => undefined)
    }, [])

    const handleUpload = async (file: File) => {
        setUploading(true)
        setError("")

        try {
            const formData = new FormData()
            formData.append("file", file)

            const response = await fetch("/api/media", { method: "POST", body: formData })
            const data = await response.json().catch(() => ({}))

            if (!response.ok) {
                setError(data.error || "Upload failed.")
                return
            }

            setLibrary((current) => [data, ...current])
            onChange(data.url)
        } catch {
            setError("Upload failed. Check your connection and try again.")
        } finally {
            setUploading(false)
            if (fileInput.current) {
                fileInput.current.value = ""
            }
        }
    }

    return (
        <div className="space-y-3">
            <Label>{label}</Label>

            <div className="overflow-hidden rounded-lg border bg-muted/30">
                {value ? (
                    <div className="relative aspect-video">
                        <SafeImage src={value} alt="Selected featured image" fill className="object-cover" />
                    </div>
                ) : (
                    <div className="flex aspect-video flex-col items-center justify-center gap-2 text-muted-foreground">
                        <ImageIcon className="h-8 w-8 opacity-40" />
                        <p className="text-sm">No image selected</p>
                    </div>
                )}
            </div>

            <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileInput.current?.click()}>
                    {uploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                    {value ? "Replace image" : "Upload image"}
                </Button>

                <Button type="button" variant="outline" size="sm" onClick={() => setShowLibrary((open) => !open)}>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {showLibrary ? "Hide library" : "Choose from library"}
                </Button>

                {value && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => onChange("")}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove
                    </Button>
                )}
            </div>

            <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) handleUpload(file)
                }}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            {showLibrary && (
                <div className="rounded-lg border p-3">
                    {library.length === 0 ? (
                        <p className="py-4 text-center text-sm text-muted-foreground">
                            Nothing uploaded yet. Upload an image and it will appear here.
                        </p>
                    ) : (
                        <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
                            {library.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => {
                                        onChange(item.url)
                                        setShowLibrary(false)
                                    }}
                                    className="relative aspect-video overflow-hidden rounded border transition-opacity hover:opacity-80"
                                    title={item.filename}
                                >
                                    <SafeImage src={item.url} alt={item.filename} fill className="object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-xs font-normal text-muted-foreground">
                    Or paste an image URL
                </Label>
                <Input
                    id="imageUrl"
                    value={value || ""}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder="https://example.com/photo.jpg"
                />
            </div>
        </div>
    )
}
