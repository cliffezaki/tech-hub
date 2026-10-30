import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
