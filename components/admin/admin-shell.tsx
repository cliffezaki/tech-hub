"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
    AlertTriangle,
    ExternalLink,
    FileText,
    Home,
    ImageIcon,
    LayoutDashboard,
    LogOut,
    Menu,
    Newspaper,
    Settings,
    X,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface StoreStatus {
    mode: "sanity" | "file"
    writable: boolean
    reason?: string
    authConfigured: boolean
    openAccess: boolean
}

const NAV_ITEMS = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
    { href: "/admin/articles", label: "Articles", icon: Newspaper },
    { href: "/admin/pages", label: "Pages", icon: FileText },
    { href: "/admin/media", label: "Media", icon: ImageIcon },
    { href: "/admin/homepage", label: "Homepage", icon: Home },
    { href: "/admin/settings", label: "Settings", icon: Settings },
]

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const [status, setStatus] = useState<StoreStatus | null>(null)
    const [menuOpen, setMenuOpen] = useState(false)

    useEffect(() => {
        fetch("/api/status")
            .then((response) => response.json())
            .then(setStatus)
            .catch(() => setStatus(null))
    }, [])

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" })
        router.push("/admin/login")
        router.refresh()
    }

    const nav = (
        <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
                const Icon = item.icon

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                            active
                                ? "bg-foreground text-background"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                )
            })}
        </nav>
    )

    return (
        <div className="min-h-screen bg-muted/30">
            <header className="sticky top-0 z-40 border-b bg-background">
                <div className="flex h-14 items-center gap-3 px-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setMenuOpen((open) => !open)}
                        aria-label="Toggle dashboard menu"
                    >
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>

                    <Link href="/admin" className="flex items-baseline gap-0.5">
                        <span className="text-sm font-black uppercase leading-none">TECH</span>
                        <span className="bg-foreground px-1.5 py-1 text-sm font-black uppercase leading-none text-background">
                            HUB
                        </span>
                    </Link>
                    <span className="hidden text-sm text-muted-foreground sm:inline">Content dashboard</span>

                    <div className="ml-auto flex items-center gap-2">
                        <Link href="/" target="_blank">
                            <Button variant="outline" size="sm">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                View site
                            </Button>
                        </Link>
                        {status?.authConfigured && (
                            <Button variant="ghost" size="sm" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign out
                            </Button>
                        )}
                    </div>
                </div>
            </header>

            <div className="mx-auto flex w-full max-w-7xl gap-8 px-4 py-6">
                <aside className="hidden w-56 shrink-0 lg:block">
                    <div className="sticky top-20">{nav}</div>
                </aside>

                {menuOpen && (
                    <div className="fixed inset-0 top-14 z-30 bg-background p-4 lg:hidden">{nav}</div>
                )}

                <main className="min-w-0 flex-1 space-y-6">
                    {status && !status.writable && (
                        <div className="flex gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-100">
                            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-semibold">Saving is disabled in this environment</p>
                                <p className="mt-1 opacity-90">{status.reason}</p>
                            </div>
                        </div>
                    )}

                    {status?.openAccess && (
                        <div className="rounded-lg border border-dashed bg-background p-3 text-xs text-muted-foreground">
                            Local development mode — no password required. Set <code className="font-mono">ADMIN_PASSWORD</code>{" "}
                            before deploying so the live dashboard is protected.
                        </div>
                    )}

                    {children}
                </main>
            </div>
        </div>
    )
}
