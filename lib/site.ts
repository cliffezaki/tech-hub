/**
 * Absolute site URL, needed for metadata, Open Graph images, and the sitemap.
 * Vercel sets VERCEL_PROJECT_PRODUCTION_URL automatically, so a custom domain only
 * has to be configured once via NEXT_PUBLIC_SITE_URL.
 */
export function getSiteUrl() {
    const explicit = process.env.NEXT_PUBLIC_SITE_URL
    if (explicit) {
        return explicit.replace(/\/$/, "")
    }

    const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
    if (vercelUrl) {
        return `https://${vercelUrl}`
    }

    return "http://localhost:3000"
}
