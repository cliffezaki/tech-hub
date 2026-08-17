import { ArticleForm } from '@/components/admin/article-form';

export default function NewArticlePage() {
    return (
        <div className="container mx-auto max-w-3xl py-12">
            <h1 className="text-3xl font-bold mb-8 font-[family-name:var(--font-playfair)]">Create New Article</h1>
            <ArticleForm />
        </div>
    );
}
