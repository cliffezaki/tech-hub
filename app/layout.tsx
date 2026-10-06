import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { getSiteSettings } from "@/lib/content"
import { getSiteUrl } from "@/lib/site"
import { publishingConfig } from "@/lib/advertising"

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
        icons: publishing?.favicon
            ? { icon: String(publishing.favicon) }
            : undefined,
        openGraph: {
            siteName: settings.siteName,
            type: "website",
            images: publishing?.socialImage
                ? [String(publishing.socialImage)]
                : undefined,
        },
        twitter: {
            card: "summary_large_image",
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
                    defaultTheme="light"
                    disableTransitionOnChange
                >
                    {children}
                </ThemeProvider>
            </body>
        </html>
    )
}
