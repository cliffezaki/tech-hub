import type { MetadataRoute } from "next"

import { getSiteUrl } from "@/lib/site"
import { publishingConfig } from "@/lib/advertising"

export default async function robots(): Promise<MetadataRoute.Robots> {
    const settings = await publishingConfig()
    return {
        rules: {
            userAgent: "*",
            allow: "/",
            disallow: settings?.noIndex
                ? ["/"]
                : ["/admin", "/studio", "/api", "/account"],
        },
        sitemap: `${getSiteUrl()}/sitemap.xml`,
    }
}
