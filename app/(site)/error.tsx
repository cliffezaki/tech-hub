"use client"

import { useEffect } from "react"

import { Button } from "@/components/ui/button"

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="site-container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
            <p className="kicker text-brand-red">Something went wrong</p>
            <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">This page failed to load</h1>
            <p className="mt-4 max-w-md text-muted-foreground">
                The problem has been logged. Try again, and if it keeps happening check that the CMS connection is
                configured correctly.
            </p>
            <Button className="mt-8" onClick={reset}>
                Try again
            </Button>
        </div>
    )
}
