
const WORDPRESS_API_URL = process.env.NEXT_PUBLIC_WORDPRESS_URL || 'https://techcrunch.com/wp-json'; // Fallback to a real public WP API for demo purposes if not set

export interface WPPost {
    id: number;
    date: string;
    slug: string;
    link: string;
    title: {
        rendered: string;
    };
    excerpt: {
        rendered: string;
    };
    content: {
        rendered: string;
    };
    author: number;
    featured_media: number;
    categories: number[];
    _embedded?: {
        'wp:featuredmedia'?: Array<{
            source_url: string;
        }>;
        author?: Array<{
            name: string;
        }>;
        'wp:term'?: Array<Array<{
            id: number;
            name: string;
            slug: string;
        }>>;
    };
}

export interface Article {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    section: string;
    author: string;
    publishedAt: string;
    readTime: string;
    imageUrl?: string;
}

export async function getPosts(params: { category?: string; perPage?: number; tag?: string } = {}): Promise<Article[]> {
    const query = new URLSearchParams({
        _embed: 'true',
        per_page: (params.perPage || 10).toString(),
    });

    if (params.category) {
        // Note: This requires knowing the Category ID, but for simplicity in this demo 
        // we might need to fetch categories first or assume standard generic queries.
        // For a robust implementation, we'd look up the ID. 
        // For now, let's just fetch recent posts to show connectivity.
    }

    try {
        // We use a public API for demo if the env var isn't set to a custom site
        const endpoint = `${WORDPRESS_API_URL}/wp/v2/posts?${query.toString()}`;
        const res = await fetch(endpoint, { next: { revalidate: 3600 } });

        if (!res.ok) throw new Error('Failed to fetch from WordPress');

        const data: WPPost[] = await res.json();

        return data.map(mapWPPostToArticle);
    } catch (error) {
        console.error('Error fetching WordPress posts:', error);
        return [];
    }
}

export async function getPostBySlug(slug: string): Promise<Article | null> {
    try {
        const query = new URLSearchParams({
            _embed: 'true',
            slug: slug,
        });

        const endpoint = `${WORDPRESS_API_URL}/wp/v2/posts?${query.toString()}`;
        const res = await fetch(endpoint, { next: { revalidate: 3600 } });

        if (!res.ok) throw new Error('Failed to fetch from WordPress');

        const data: WPPost[] = await res.json();

        if (data.length > 0) {
            return mapWPPostToArticle(data[0]);
        }
        return null;
    } catch (error) {
        console.error('Error fetching WordPress post:', error);
        return null;
    }
}

function mapWPPostToArticle(post: WPPost): Article {
    // Safely extract featured image
    const imageUrl = post._embedded?.['wp:featuredmedia']?.[0]?.source_url;

    // Safely extract author
    const author = post._embedded?.author?.[0]?.name || 'Staff Writer';

    // Safely extract category (taking the first one)
    const categoryTerm = post._embedded?.['wp:term']?.[0]?.[0];
    const category = categoryTerm?.name || 'Tech';

    // Strip HTML from excerpt for cleaner cards
    const excerpt = post.excerpt.rendered.replace(/<[^>]+>/g, '').substring(0, 150) + '...';

    return {
        id: post.id.toString(),
        title: post.title.rendered, // formatting needed? WP can return HTML entities
        slug: post.slug,
        excerpt: excerpt,
        content: post.content.rendered,
        category: category,
        section: 'news', // Defaulting to news for flat WP structure, or map via categories
        author: author,
        publishedAt: post.date,
        readTime: '5 min read', // WP doesn't provide this by default, calculation needed or custom field
        imageUrl: imageUrl,
    };
}
