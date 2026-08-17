import { NextResponse } from 'next/server';
import { getArticle, updateArticle, deleteArticle } from '@/lib/articles';

interface Props {
    params: Promise<{
        id: string;
    }>;
}

export async function GET(request: Request, { params }: Props) {
    const { id } = await params;
    const article = await getArticle(id);

    if (!article) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(article);
}

export async function PUT(request: Request, { params }: Props) {
    const { id } = await params;
    const body = await request.json();

    const updated = await updateArticle(id, body);

    if (!updated) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Props) {
    const { id } = await params;
    const deleted = await deleteArticle(id);

    if (!deleted) {
        return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Deleted successfully' });
}
