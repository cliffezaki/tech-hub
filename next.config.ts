import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
