"use client"
import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { track } from "@/components/tracking"
type Ad = {
    id: string
    placement: string
    creative: {
        name?: string
        imageUrl?: string
        mobileImageUrl?: string
        alt?: string
        text?: string
        cta?: string
        destination: string
    }
}
export function AdSlot({ slot }: { slot: string }) {
    const path = usePathname()
    const [ads, setAds] = useState<Ad[]>([])
    const ref = useRef<HTMLDivElement>(null)
    useEffect(() => {
        let active = true
        fetch(
            `/api/public/ads?slot=${encodeURIComponent(slot)}&path=${encodeURIComponent(path)}`
        )
            .then((r) => r.json())
            .then((d) => {
                if (active) setAds(Array.isArray(d) ? d : [])
            })
            .catch(() => {})
        return () => {
            active = false
        }
    }, [slot, path])
    useEffect(() => {
        if (!ref.current || !ads.length) return
        const seen = new Set<string>()
        const observer = new IntersectionObserver(
            (entries) => {
                if (
                    entries[0]?.isIntersecting &&
                    localStorage.getItem("techhub-consent") === "accepted"
                )
                    for (const ad of ads)
                        if (!seen.has(ad.id)) {
                            seen.add(ad.id)
                            track("impression", {
                                campaign: ad.id,
                                placement: ad.placement,
                            })
                        }
            },
            { threshold: 0.5 }
        )
        observer.observe(ref.current)
        return () => observer.disconnect()
    }, [ads])
    if (!ads.length) return null
    return (
        <div ref={ref} className="site-container my-6">
            {ads.map((ad) => (
                <aside
                    key={ad.id}
                    className="mx-auto max-w-5xl overflow-hidden rounded-lg border"
                >
                    <p className="bg-muted px-4 py-1 text-center text-[10px] uppercase tracking-widest">
                        Advertisement
                    </p>
                    <a
                        href={ad.creative.destination}
                        rel="sponsored noopener noreferrer"
                        target="_blank"
                        className="block text-center"
                        onClick={() =>
                            track("click", {
                                campaign: ad.id,
                                placement: ad.placement,
                            })
                        }
                    >
                        {ad.creative.imageUrl && (
                            <picture>
                                {ad.creative.mobileImageUrl && (
                                    <source
                                        media="(max-width: 640px)"
                                        srcSet={ad.creative.mobileImageUrl}
                                    />
                                )}
                                <img
                                    src={ad.creative.imageUrl}
                                    alt={
                                        ad.creative.alt ||
                                        ad.creative.name ||
                                        "Advertisement"
                                    }
                                    loading="lazy"
                                    className="mx-auto max-h-72 w-full object-contain"
                                />
                            </picture>
                        )}
                        {ad.creative.text && (
                            <p className="p-4">{ad.creative.text}</p>
                        )}
                        {ad.creative.cta && (
                            <p className="pb-4 font-semibold underline">
                                {ad.creative.cta}
                            </p>
                        )}
                    </a>
                </aside>
            ))}
        </div>
    )
}
