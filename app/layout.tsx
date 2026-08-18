import type { Metadata } from "next"
import { Playfair_Display, Inter } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { getSiteSettings } from "@/lib/content"
import { getSiteUrl } from "@/lib/site"

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

    return {
        metadataBase: new URL(getSiteUrl()),
        title: {
            default: `${settings.siteName} | ${settings.tagline}`,
            template: `%s | ${settings.siteName}`,
        },
        description: settings.tagline,
        openGraph: {
            siteName: settings.siteName,
            type: "website",
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
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en" suppressHydrationWarning className={`${playfair.variable} ${inter.variable}`}>
            <body suppressHydrationWarning>
                <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
                    {children}
                </ThemeProvider>
            </body>
        </html>
    )
}
