import Image from "next/image"

import { cn } from "@/lib/utils"

/**
 * Hosts that `next.config.ts` allows the Next.js image optimiser to fetch from.
 * Anything else — an editor pasting a URL from any site — is rendered with a plain
 * <img> instead, because next/image throws for hostnames it has not been configured with.
 */
const OPTIMIZED_HOSTS = new Set(["images.unsplash.com", "cdn.sanity.io"])

function canOptimize(src: string) {
    if (src.startsWith("/")) {
        return true
    }

    try {
        return OPTIMIZED_HOSTS.has(new URL(src).hostname)
    } catch {
        return false
    }
}

interface SafeImageProps {
    src: string
    alt: string
    fill?: boolean
    width?: number
    height?: number
    className?: string
    sizes?: string
    priority?: boolean
}

export function SafeImage({ src, alt, fill, width, height, className, sizes, priority }: SafeImageProps) {
    if (!src) {
        return null
    }

    if (canOptimize(src)) {
        if (fill) {
            return <Image src={src} alt={alt} fill className={className} sizes={sizes} priority={priority} />
        }

        return (
            <Image
                src={src}
                alt={alt}
                width={width || 800}
                height={height || 600}
                className={className}
                sizes={sizes}
                priority={priority}
            />
        )
    }

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={src}
            alt={alt}
            width={fill ? undefined : width || 800}
            height={fill ? undefined : height || 600}
            loading={priority ? "eager" : "lazy"}
            className={cn(fill && "absolute inset-0 h-full w-full", className)}
        />
    )
}
