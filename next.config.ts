import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    poweredByHeader: false,
    async headers() {
        return [{ source: "/:path*", headers: [
            { key: "X-Content-Type-Options", value: "nosniff" },
            { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
            { key: "X-Frame-Options", value: "SAMEORIGIN" },
            { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
            { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ] }, { source: "/api/:path*", headers: [
            { key: "Cache-Control", value: "private, no-store" },
        ] }, { source: "/reader/:path*", headers: [
            { key: "Cache-Control", value: "private, no-store" },
            { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ] }]
    },
    experimental: {
        // Persistent compiler caches can serialize server environment values.
        // Keep credentials out of these build artifacts without excluding them
        // from the host's secret scanner.
        turbopackFileSystemCacheForBuild: false,
    },
    images: {
        // Hosts the image optimiser may fetch from. Editors can still paste a URL from
        // anywhere else — `components/safe-image.tsx` renders those unoptimised rather
        // than letting next/image throw.
        remotePatterns: [
            { protocol: "https", hostname: "images.unsplash.com" },
            { protocol: "https", hostname: "cdn.sanity.io" },
        ],
    },
}

export default nextConfig
