'use client'

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { PageForm } from "@/components/admin/page-form"
import type { PageContent } from "@/lib/types"

export default function EditPagePage() {
    const params = useParams()
    const id = params?.id as string
    const [page, setPage] = useState<PageContent | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) {
            return
        }

        fetch(`/api/pages/${id}`)
            .then((response) => response.json())
            .then((data) => {
                if (!data.error) {
                    setPage(data)
                }
            })
            .finally(() => setLoading(false))
    }, [id])

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!page) {
        return <div className="container mx-auto max-w-3xl px-4 py-12">Page not found</div>
    }

    return (
        <div className="container mx-auto max-w-3xl px-4 py-12">
            <h1 className="mb-8 font-[family-name:var(--font-playfair)] text-3xl font-bold">Edit Page</h1>
            <PageForm initialData={page} isEditing />
        </div>
    )
}
