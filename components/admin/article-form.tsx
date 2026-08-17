'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import type { Article } from '@/lib/types';
import { Loader2 } from 'lucide-react';

interface ArticleFormProps {
    initialData?: Article;
    isEditing?: boolean;
}

export function ArticleForm({ initialData, isEditing = false }: ArticleFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Slugify helper
    const generateSlug = (text: string) => {
        return text.toString().toLowerCase()
            .replace(/\s+/g, '-')           // Replace spaces with -
            .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
            .replace(/\-\-+/g, '-')         // Replace multiple - with single -
            .replace(/^-+/, '')             // Trim - from start of text
            .replace(/-+$/, '');            // Trim - from end of text
    };

    const [formData, setFormData] = useState<Partial<Article>>(initialData || {
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        category: 'AI',
        section: 'news',
        author: 'Staff Writer',
        readTime: '5 min read',
        publishedAt: new Date().toISOString()
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updates = { ...prev, [name]: value };
            // Auto-generate slug from title if not manually edited yet (or always for simplicity)
            if (name === 'title' && !isEditing) {
                updates.slug = generateSlug(value);
            }
            return updates;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                publishedAt: formData.publishedAt
                    ? new Date(formData.publishedAt).toISOString()
                    : new Date().toISOString(),
            };

            const url = isEditing && initialData?.id 
                ? `/api/articles/${initialData.id}` 
                : '/api/articles';
            
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                router.push('/admin');
                router.refresh();
            } else {
                alert('Something went wrong');
            }
        } catch (error) {
            console.error(error);
            alert('Failed to save');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl bg-card p-8 rounded-lg border shadow-sm">
            
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input 
                    id="title" 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange} 
                    required 
                    placeholder="Article Headline"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input 
                        id="slug" 
                        name="slug" 
                        value={formData.slug} 
                        onChange={handleChange} 
                        required 
                        placeholder="article-headline-slug"
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="section">Section</Label>
                    <select
                        id="section"
                        name="section"
                        value={formData.section}
                        onChange={handleChange}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                        <option value="news">News</option>
                        <option value="reviews">Reviews</option>
                        <option value="how-to">How To</option>
                        <option value="how-stuff-works">How Stuff Works</option>
                        <option value="tech-kenya">Tech Kenya</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" value={formData.category} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="readTime">Read Time</Label>
                    <Input id="readTime" name="readTime" value={formData.readTime} onChange={handleChange} />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="author">Author</Label>
                    <Input id="author" name="author" value={formData.author} onChange={handleChange} required />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="publishedAt">Published Date</Label>
                    <Input
                        id="publishedAt"
                        name="publishedAt"
                        type="datetime-local"
                        value={formData.publishedAt ? formData.publishedAt.slice(0, 16) : ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input
                    id="imageUrl"
                    name="imageUrl"
                    type="url"
                    value={formData.imageUrl || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/article-image.jpg"
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea 
                    id="excerpt" 
                    name="excerpt" 
                    value={formData.excerpt} 
                    onChange={handleChange} 
                    rows={3}
                    placeholder="Short summary for the card view..."
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="content">Content (Markdown)</Label>
                <Textarea 
                    id="content" 
                    name="content" 
                    value={formData.content} 
                    onChange={handleChange} 
                    rows={15}
                    className="font-mono text-sm"
                    placeholder="# Heading\n\nWrite your article here using Markdown..."
                />
            </div>

            <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline" type="button" onClick={() => router.back()}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isEditing ? 'Update Article' : 'Publish Article'}
                </Button>
            </div>
        </form>
    );
}
