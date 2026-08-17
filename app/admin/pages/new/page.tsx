import { PageForm } from "@/components/admin/page-form"

export default function NewPagePage() {
    return (
        <div className="container mx-auto max-w-3xl px-4 py-12">
            <h1 className="mb-8 font-[family-name:var(--font-playfair)] text-3xl font-bold">Create New Page</h1>
            <PageForm />
        </div>
    )
}
