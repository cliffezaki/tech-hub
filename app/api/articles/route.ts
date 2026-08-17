import { NextResponse } from 'next/server';
import { getArticles, createArticle } from '@/lib/articles';

export async function GET() {
    try {
        const articles = await getArticles();
        return NextResponse.json(articles);
    } catch {
        return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.title || !body.content) {
            return NextResponse.json({ error: 'Title and content are required' }, { status: 400 });
        }

        const newArticle = await createArticle(body);
        return NextResponse.json(newArticle, { status: 201 });
    } catch {
        return NextResponse.json({ error: 'Failed to create article' }, { status: 500 });
    }
}
