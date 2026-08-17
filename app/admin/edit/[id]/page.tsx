'use client';

import { useEffect, useState } from 'react';
import { ArticleForm } from '@/components/admin/article-form';
import type { Article } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function EditArticlePage() {
    const params = useParams();
    const id = params?.id as string;

    const [article, setArticle] = useState<Article | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetch(`/api/articles/${id}`)
                .then(res => res.json())
                .then(data => {
                    if (!data.error) setArticle(data);
                })
                .finally(() => setLoading(false));
        }
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!article) return <div>Article not found</div>;

    return (
        <div className="container mx-auto max-w-3xl py-12">
            <h1 className="text-3xl font-bold mb-8 font-[family-name:var(--font-playfair)]">Edit Article</h1>
            <ArticleForm initialData={article} isEditing />
        </div>
    );
}
