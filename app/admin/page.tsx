'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Edit, Trash, Plus, FileText, Loader2, ImageIcon, LayoutDashboard, Newspaper } from 'lucide-react';
import type { Article, PageContent } from '@/lib/types';

export default function AdminPage() {
    const [articles, setArticles] = useState<Article[]>([]);
    const [pages, setPages] = useState<PageContent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const [articlesRes, pagesRes] = await Promise.all([
                    fetch('/api/articles'),
                    fetch('/api/pages'),
                ]);

                const [articlesData, pagesData] = await Promise.all([
                    articlesRes.json(),
                    pagesRes.json(),
                ]);

                if (Array.isArray(articlesData)) {
                    setArticles(articlesData);
                }

                if (Array.isArray(pagesData)) {
                    setPages(pagesData);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard content', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this article?')) return;

        try {
            await fetch(`/api/articles/${id}`, { method: 'DELETE' });
            setArticles((current) => current.filter((article) => article.id !== id));
        } catch (error) {
            console.error('Failed to delete', error);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    const sections = new Set(articles.map((article) => article.section));
    const images = new Set(articles.map((article) => article.imageUrl).filter(Boolean));

    return (
        <div className="container mx-auto max-w-6xl px-4 py-12">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-brand-red">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                    </div>
                    <h1 className="text-3xl font-bold font-[family-name:var(--font-playfair)]">Content Manager</h1>
                    <p className="text-muted-foreground">Manage posts, pages, images, and CMS-backed demo content.</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/admin/pages">
                        <Button variant="outline">Pages</Button>
                    </Link>
                    <Link href="/admin/media">
                        <Button variant="outline">Media</Button>
                    </Link>
                    <Link href="/admin/new">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> New Post
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Posts</p>
                        <Newspaper className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-3 text-3xl font-bold">{articles.length}</div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Pages</p>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-3 text-3xl font-bold">{pages.length}</div>
                </Card>
                <Card className="p-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Images</p>
                        <ImageIcon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-3 text-3xl font-bold">{images.size}</div>
                </Card>
                <Card className="p-4">
                    <p className="text-sm text-muted-foreground">Active Sections</p>
                    <div className="mt-3 text-3xl font-bold">{sections.size}</div>
                </Card>
            </div>

            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold font-[family-name:var(--font-playfair)]">Posts</h2>
                <Link href="/admin/new" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                    Add post
                </Link>
            </div>

            <div className="grid gap-4">
                {articles.length === 0 ? (
                    <Card className="bg-muted/50 border-dashed py-12 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <FileText className="h-10 w-10 text-muted-foreground/50" />
                            <h3 className="text-lg font-semibold">No articles yet</h3>
                            <p className="text-muted-foreground">Create your first article to get started.</p>
                        </div>
                    </Card>
                ) : (
                    articles.map((article) => (
                        <Card key={article.id} className="flex items-center justify-between p-4">
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold font-[family-name:var(--font-playfair)]">{article.title}</h3>
                                <div className="flex gap-3 text-xs text-muted-foreground uppercase tracking-wider mt-1">
                                    <span className={article.section === 'news' ? 'text-blue-500' : 'text-purple-500'}>
                                        {article.section}
                                    </span>
                                    <span>/</span>
                                    <span>{article.category}</span>
                                    <span>/</span>
                                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link href={`/admin/edit/${article.id}`}>
                                    <Button variant="outline" size="sm">
                                        <Edit className="h-4 w-4 mr-2" /> Edit
                                    </Button>
                                </Link>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(article.id)}
                                >
                                    <Trash className="h-4 w-4" />
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
