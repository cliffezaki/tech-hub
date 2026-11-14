export interface TrendingStory {
    id: string
    headline: string
    summary: string
    detail: string
    whyItMatters: string
    sources: { name: string; url: string }[]
    expiresAt: string
}

export interface TrendingFeed {
    stories: TrendingStory[]
    generatedAt: string
    fingerprint: string
}
