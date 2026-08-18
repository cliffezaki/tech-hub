import type { Metadata } from "next"
import Link from "next/link"

import { isSanityConfigured } from "@/sanity/env"
import StudioClient from "./studio-client"

export const metadata: Metadata = {
    title: "Sanity Studio",
    robots: { index: false, follow: false },
}

export const dynamic = "force-static"

/**
 * The advanced editor. Rendering the Studio without a project id throws, so an
 * unconfigured install gets setup instructions instead of a crash.
 */
export default function StudioPage() {
    if (!isSanityConfigured()) {
        return (
            <div className="mx-auto flex min-h-screen max-w-xl flex-col justify-center px-6 py-16">
                <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold">Sanity is not connected</h1>
                <p className="mt-4 text-muted-foreground">
                    Sanity Studio is the optional advanced editor. It needs a project id before it can load.
                </p>

                <ol className="mt-6 space-y-3 text-sm">
                    <li>
                        1. Create a free project at{" "}
                        <a href="https://sanity.io/manage" target="_blank" rel="noreferrer" className="font-medium underline">
                            sanity.io/manage
                        </a>
                    </li>
                    <li>
                        2. Add <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_SANITY_PROJECT_ID</code>{" "}
                        to your environment variables
                    </li>
                    <li>3. Redeploy, or restart the dev server</li>
                </ol>

                <p className="mt-8 text-sm text-muted-foreground">
                    You do not need Studio for everyday work — the{" "}
                    <Link href="/admin" className="font-medium underline">
                        Tech Hub dashboard
                    </Link>{" "}
                    covers articles, pages, images, and settings.
                </p>
            </div>
        )
    }

    return <StudioClient />
}
