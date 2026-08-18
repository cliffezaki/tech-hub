import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { getSiteSettings } from "@/lib/content"

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
    const settings = await getSiteSettings()

    return (
        <div className="flex min-h-screen flex-col">
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-foreground focus:px-4 focus:py-2 focus:text-background"
            >
                Skip to content
            </a>
            <Navbar siteName={settings.siteName} />
            <main id="main-content" className="flex-1">
                {children}
            </main>
            <Footer />
        </div>
    )
}
