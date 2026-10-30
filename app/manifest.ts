import type { MetadataRoute } from "next"
import { getSiteSettings } from "@/lib/content"
import { siteIcon } from "@/lib/site-identity"
export const dynamic = "force-dynamic"
export default async function manifest(): Promise<MetadataRoute.Manifest> {
    const settings = await getSiteSettings()
    return { name: settings.siteName, short_name: settings.siteName.slice(0, 30), description: settings.tagline, start_url: "/", display: "browser", background_color: "#FAF8F3", theme_color: "#C8202D", icons: [192, 512].map(size => ({ src: siteIcon(settings, size as 192 | 512), sizes: `${size}x${size}`, type: settings.iconSource ? "image/png" : "image/svg+xml", purpose: "any" })) }
}
