import fs from 'fs';
import path from 'path';
import type { Article } from './types';

// Define the content directory
const contentDirectory = path.join(process.cwd(), 'content', 'articles');

// Ensure directory exists
if (!fs.existsSync(contentDirectory)) {
    fs.mkdirSync(contentDirectory, { recursive: true });
}

export function generateId(): string {
    return Math.random().toString(36).substring(2, 9);
}

export async function getArticles(): Promise<Article[]> {
    const fileNames = fs.readdirSync(contentDirectory);
    const allArticlesData = fileNames.map((fileName) => {
        // Read markdown file as string
        const fullPath = path.join(contentDirectory, fileName);
        const fileContents = fs.readFileSync(fullPath, 'utf8');

        // Parse JSON Result
        const article: Article = JSON.parse(fileContents);
        return article;
    });

    // Sort articles by date
    return allArticlesData.sort((a, b) => {
        if (a.publishedAt < b.publishedAt) {
            return 1;
        } else {
            return -1;
        }
    });
}

export async function getArticle(id: string): Promise<Article | null> {
    const fullPath = path.join(contentDirectory, `${id}.json`);
    if (fs.existsSync(fullPath)) {
        const fileContents = fs.readFileSync(fullPath, 'utf8');
        return JSON.parse(fileContents);
    }
    return null;
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
    const articles = await getArticles();
    return articles.find(article => article.slug === slug) || null;
}

export async function createArticle(data: Omit<Article, 'id'>): Promise<Article> {
    const id = generateId();
    const newArticle: Article = { ...data, id };
    const fullPath = path.join(contentDirectory, `${id}.json`);

    fs.writeFileSync(fullPath, JSON.stringify(newArticle, null, 2));
    return newArticle;
}

export async function updateArticle(id: string, data: Partial<Article>): Promise<Article | null> {
    const currentArticle = await getArticle(id);
    if (!currentArticle) return null;

    const updatedArticle = { ...currentArticle, ...data };
    const fullPath = path.join(contentDirectory, `${id}.json`);

    fs.writeFileSync(fullPath, JSON.stringify(updatedArticle, null, 2));
    return updatedArticle;
}

export async function deleteArticle(id: string): Promise<boolean> {
    const fullPath = path.join(contentDirectory, `${id}.json`);
    if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        return true;
    }
    return false;
}
