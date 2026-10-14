import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { getSiteSettings } from "@/lib/content"
import { getSiteUrl } from "@/lib/site"
import { publishingConfig } from "@/lib/advertising"
import { siteIcon, versionedIcon } from "@/lib/site-identity"

const playfair = Playfair_Display({
    subsets: ["latin"],
    variable: "--font-playfair",
    display: "swap",
})

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
    display: "swap",
})

export async function generateMetadata(): Promise<Metadata> {
    const settings = await getSiteSettings()
    const publishing = await publishingConfig()

    return {
        metadataBase: new URL(getSiteUrl()),
        title: {
            default: `${settings.siteName} | ${settings.tagline}`,
            template: `%s | ${settings.siteName}`,
        },
        description: String(publishing?.description || settings.tagline),
        robots: publishing?.noIndex
            ? { index: false, follow: false }
            : undefined,
        icons: {
            icon: [
                { url: siteIcon(settings, 16), sizes: "16x16" },
                { url: siteIcon(settings, 32), sizes: "32x32" },
                { url: versionedIcon("/favicon.ico", settings.identityVersion), sizes: "any" },
            ],
            apple: [{ url: siteIcon(settings, 180), sizes: "180x180" }],
        },
        openGraph: {
            siteName: settings.siteName,
            type: "website",
            title: settings.socialTitle || settings.siteName,
            description: settings.socialDescription || settings.tagline,
            images: settings.socialImage || publishing?.socialImage
                ? [String(settings.socialImage || publishing?.socialImage)]
                : undefined,
        },
        twitter: {
            card: "summary_large_image",
            title: settings.socialTitle || settings.siteName,
            description: settings.socialDescription || settings.tagline,
            images: settings.socialImage || publishing?.socialImage ? [String(settings.socialImage || publishing?.socialImage)] : undefined,
        },
    }
}

/**
 * Shared document shell only. The public site adds its header and footer in
 * `app/(site)/layout.tsx`; the dashboard supplies its own chrome instead.
 */
export default async function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    const publishing = await publishingConfig()
    return (
        <html
            lang={String(publishing?.language || "en")}
            suppressHydrationWarning
            className={`${playfair.variable} ${inter.variable}`}
        >
            <body suppressHydrationWarning>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    enableColorScheme
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    )
}
