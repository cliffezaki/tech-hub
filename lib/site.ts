/**
 * Absolute site URL, needed for metadata, Open Graph images, and the sitemap.
 * Set NEXT_PUBLIC_SITE_URL for the canonical custom domain. Until then, use the
 * hosting provider's deployment URL rather than publishing localhost links.
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

    const netlifyUrl = process.env.DEPLOY_PRIME_URL || process.env.URL
    if (netlifyUrl) {
        return netlifyUrl.replace(/\/$/, "")
    }

    return "http://localhost:3000"
}
