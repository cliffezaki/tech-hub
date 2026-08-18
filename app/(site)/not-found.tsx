import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"

export default function NotFound() {
    return (
        <div className="site-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
            <p className="kicker text-brand-red">404</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight md:text-5xl">This page has moved on</h1>
            <p className="mt-4 max-w-md text-muted-foreground">
                The story you are looking for may have been renamed or removed. Try one of the sections below.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
                {ARTICLE_SECTIONS.map((section) => (
                    <Link key={section} href={`/${section}`}>
                        <Button variant="outline" size="sm">
                            {SECTION_META[section].label}
                        </Button>
                    </Link>
                ))}
            </div>

            <Link href="/" className="mt-8">
                <Button>Back to the homepage</Button>
            </Link>
        </div>
    )
}
