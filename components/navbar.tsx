"use client"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { Menu, X, Search, Sun, Moon } from "lucide-react"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"
type Item = {
    id: string
    name: string
    href: string
    menu: string
    hidden?: boolean
}
const defaults: Item[] = [
    { id: "home", name: "Home", href: "/", menu: "main" },
    ...ARTICLE_SECTIONS.map((s) => ({
        id: s,
        name: SECTION_META[s].navLabel,
        href: `/${s}`,
        menu: "main",
    })),
    { id: "about", name: "About", href: "/about", menu: "main" },
    { id: "contact", name: "Contact", href: "/contact", menu: "main" },
    {
        id: "advertise",
        name: "Advertise With Us",
        href: "/advertise",
        menu: "main",
    },
]
export function Navbar({ siteName = "Tech Hub" }: { siteName?: string }) {
    const [open, setOpen] = useState(false)
    const [items, setItems] = useState(defaults)
    const [signedIn, setSignedIn] = useState(false)
    const path = usePathname()
    const { theme, setTheme } = useTheme()
    const trigger = useRef<HTMLButtonElement>(null)
    const drawer = useRef<HTMLDivElement>(null)
    const [firstWord, ...restWords] = siteName.trim().split(/\s+/)
    const primaryHrefs = new Set(["/", ...ARTICLE_SECTIONS.map((s) => `/${s}`)])
    const logo = (
        <span className="flex items-baseline gap-0.5 text-xl font-black uppercase leading-none tracking-tight md:text-2xl">
            <span>{firstWord}</span>
            {restWords.length > 0 && (
                <span className="bg-foreground px-1.5 py-1 text-background">
                    {restWords.join(" ")}
                </span>
            )}
        </span>
    )
    useEffect(() => {
        fetch("/api/public/navigation")
            .then((r) => r.json())
            .then((d) => {
                if (Array.isArray(d) && d.some((i) => i.menu === "main"))
                    setItems(d.filter((i) => i.menu === "main"))
            })
            .catch(() => {})
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((d) => setSignedIn(Boolean(d.user)))
            .catch(() => {})
    }, [path])
    useEffect(() => {
        if (!open) return
        const returnFocus = trigger.current
        const previous = document.body.style.overflow
        document.body.style.overflow = "hidden"
        drawer.current?.querySelector<HTMLElement>("button")?.focus()
        function key(e: KeyboardEvent) {
            if (e.key === "Escape") setOpen(false)
            if (e.key === "Tab") {
                const links =
                    drawer.current?.querySelectorAll<HTMLElement>("a,button")
                if (!links?.length) return
                const first = links[0],
                    last = links[links.length - 1]
                if (e.shiftKey && document.activeElement === first) {
                    e.preventDefault()
                    last.focus()
                } else if (!e.shiftKey && document.activeElement === last) {
                    e.preventDefault()
                    first.focus()
                }
            }
        }
        document.addEventListener("keydown", key)
        return () => {
            document.body.style.overflow = previous
            document.removeEventListener("keydown", key)
            returnFocus?.focus()
        }
    }, [open])
    return (
        <>
            <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
                <div className="site-container grid h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <div className="flex items-center justify-self-start gap-2 sm:gap-3">
                        <button
                            ref={trigger}
                            className="shrink-0 rounded p-2 hover:bg-muted"
                            aria-label="Open navigation"
                            aria-expanded={open}
                            aria-controls="main-drawer"
                            onClick={() => setOpen(true)}
                        >
                            <Menu size={23} />
                        </button>
                        <Link
                            href="/"
                            aria-label={`${siteName} home`}
                        >
                            {logo}
                        </Link>
                    </div>
                    <nav
                        className="hidden items-center justify-center gap-5 lg:flex"
                        aria-label="Primary"
                    >
                        {items
                            .filter(
                                (i) => !i.hidden && primaryHrefs.has(i.href)
                            )
                            .map((i) => (
                                <Link
                                    key={i.id}
                                    href={i.href}
                                    aria-current={
                                        path === i.href ? "page" : undefined
                                    }
                                    className={
                                        path === i.href
                                            ? "whitespace-nowrap text-sm font-bold text-foreground"
                                            : "whitespace-nowrap text-sm font-medium text-muted-foreground hover:text-foreground"
                                    }
                                >
                                    {i.name}
                                </Link>
                            ))}
                    </nav>
                    <div className="flex items-center justify-self-end gap-3">
                        <Link href="/search" aria-label="Search">
                            <Search size={19} />
                        </Link>
                        <button
                            onClick={() =>
                                setTheme(theme === "dark" ? "light" : "dark")
                            }
                            aria-label="Toggle color theme"
                        >
                            <Sun className="hidden dark:block" size={19} />
                            <Moon className="dark:hidden" size={19} />
                        </button>
                    </div>
                </div>
            </header>
            {open && (
                <div className="fixed inset-0 z-50">
                    <div
                        className="absolute inset-0 bg-black/45"
                        onClick={() => setOpen(false)}
                    />
                    <div
                        ref={drawer}
                        id="main-drawer"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Site navigation"
                        className="absolute inset-y-0 left-0 w-[min(88vw,380px)] overflow-y-auto border-r bg-background p-7 shadow-xl"
                    >
                        <div className="mb-8 flex items-center justify-between">
                            <Link
                                href="/"
                                aria-label={`${siteName} home`}
                                onClick={() => setOpen(false)}
                            >
                                {logo}
                            </Link>
                            <button
                                onClick={() => setOpen(false)}
                                aria-label="Close navigation"
                            >
                                <X />
                            </button>
                        </div>
                        <nav className="flex flex-col">
                            {items
                                .filter((i) => !i.hidden)
                                .map((i) => (
                                    <Link
                                        className="border-b py-3 text-lg font-semibold"
                                        href={i.href}
                                        key={i.id}
                                        onClick={() => setOpen(false)}
                                    >
                                        {i.name}
                                    </Link>
                                ))}
                            <Link
                                className="mt-6 cms-primary"
                                href="/account"
                                onClick={() => setOpen(false)}
                            >
                                {signedIn ? "My account" : "Log in / Sign up"}
                            </Link>
                        </nav>
                    </div>
                </div>
            )}
        </>
    )
}
