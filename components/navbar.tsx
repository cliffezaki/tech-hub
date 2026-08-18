"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Menu, Moon, Search, Sun, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"
import { cn } from "@/lib/utils"

export function Navbar({ siteName = "Tech Hub" }: { siteName?: string }) {
    const { setTheme, theme } = useTheme()
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = React.useState(false)
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // The drawer is a full-screen overlay on small screens, so the page behind it must not scroll.
    React.useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : ""
        return () => {
            document.body.style.overflow = ""
        }
    }, [isMenuOpen])

    const [firstWord, ...restWords] = siteName.split(" ")
    const secondWord = restWords.join(" ") || "Hub"

    const logo = (size: "sm" | "md") => (
        <span className="flex items-baseline gap-0.5">
            <span
                className={cn(
                    "font-black uppercase leading-none tracking-tight",
                    size === "md" ? "text-xl md:text-2xl" : "text-base"
                )}
            >
                {firstWord}
            </span>
            <span
                className={cn(
                    "bg-foreground font-black uppercase leading-none tracking-tight text-background",
                    size === "md" ? "px-1.5 py-1 text-xl md:text-2xl" : "px-1 py-0.5 text-base"
                )}
            >
                {secondWord}
            </span>
        </span>
    )

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
                <div className="site-container flex h-16 items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="-ml-2 lg:hidden"
                        onClick={() => setIsMenuOpen(true)}
                        aria-label="Open menu"
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <Link href="/" aria-label={`${siteName} home`} className="shrink-0">
                        {logo("md")}
                    </Link>

                    <nav className="hidden flex-1 items-center justify-center gap-6 lg:flex">
                        {ARTICLE_SECTIONS.map((section) => {
                            const active = pathname.startsWith(`/${section}`)

                            return (
                                <Link
                                    key={section}
                                    href={`/${section}`}
                                    className={cn(
                                        "relative py-1 text-sm font-medium transition-colors",
                                        active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {SECTION_META[section].navLabel}
                                    {active && (
                                        <span className="absolute -bottom-[13px] left-0 h-0.5 w-full bg-brand-red" />
                                    )}
                                </Link>
                            )
                        })}
                    </nav>

                    <div className="ml-auto flex items-center gap-1 lg:ml-0">
                        <Link href="/search" aria-label="Search articles">
                            <Button variant="ghost" size="icon">
                                <Search className="h-[1.15rem] w-[1.15rem]" />
                            </Button>
                        </Link>

                        {mounted ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                aria-label="Toggle theme"
                            >
                                <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            </Button>
                        ) : (
                            <div className="h-10 w-10" />
                        )}
                    </div>
                </div>
            </header>

            {isMenuOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setIsMenuOpen(false)}
                        aria-hidden="true"
                    />

                    <div className="absolute inset-y-0 left-0 w-[85%] max-w-xs overflow-y-auto border-r bg-background p-6 shadow-xl duration-300 animate-in slide-in-from-left">
                        <div className="mb-8 flex items-center justify-between">
                            <Link href="/" onClick={() => setIsMenuOpen(false)}>
                                {logo("sm")}
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <nav className="flex flex-col">
                            {ARTICLE_SECTIONS.map((section) => (
                                <Link
                                    key={section}
                                    href={`/${section}`}
                                    className="border-b py-3 font-[family-name:var(--font-playfair)] text-lg font-semibold transition-colors hover:text-brand-red"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {SECTION_META[section].navLabel}
                                </Link>
                            ))}
                            <Link
                                href="/search"
                                className="border-b py-3 font-[family-name:var(--font-playfair)] text-lg font-semibold transition-colors hover:text-brand-red"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Search
                            </Link>
                            <Link
                                href="/contact"
                                className="border-b py-3 font-[family-name:var(--font-playfair)] text-lg font-semibold transition-colors hover:text-brand-red"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Contact
                            </Link>
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}
