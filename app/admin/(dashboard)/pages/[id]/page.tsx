import Link from "next/link"

import { PageForm } from "@/components/admin/page-form"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getStore } from "@/lib/store"
import { BUILTIN_PAGES } from "@/lib/builtin-pages"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function EditPagePage({ params }: PageProps) {
    const { id } = await params
    const builtin = BUILTIN_PAGES.find((p) => p.id === id)
    const page = builtin
        ? (await getStore().getPageBySlug(builtin.slug)) || builtin
        : await getStore().getPage(id)

    if (!page) {
        return (
            <Card className="p-10 text-center">
                <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">
                    Page not found
                </h1>
                <Link href="/admin/pages" className="mt-4 inline-block">
                    <Button variant="outline">Back to pages</Button>
                </Link>
            </Card>
        )
    }

    return <PageForm initialData={page} isEditing />
}
