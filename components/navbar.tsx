"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Navbar() {
    const { setTheme, theme } = useTheme();
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    // Only render theme toggle after component mounts on client
    React.useEffect(() => {
        setMounted(true);
    }, []);

    return (
        <>
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto flex h-16 items-center px-4">

                    {/* Left: Hamburger + Logo */}
                    <div className="flex items-center gap-4">
                        {/* Hamburger Menu Trigger */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="-ml-2"
                            onClick={() => setIsMenuOpen(true)}
                            aria-label="Open menu"
                        >
                            <Menu className="h-6 w-6" />
                        </Button>

                        {/* Logo */}
                        <Link href="/" className="flex items-baseline gap-0.5 group">
                            <span className="text-xl md:text-2xl font-black uppercase text-black dark:text-white leading-none">TECH</span>
                            <span className="text-xl md:text-2xl font-black uppercase bg-black text-white dark:bg-white dark:text-black px-1.5 py-1 leading-none">HUB</span>
                        </Link>
                    </div>

                    {/* Center: Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-5 flex-1 justify-center">
                        <Link
                            href="/news"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground tracking-wider"
                        >
                            News
                        </Link>
                        <Link
                            href="/reviews"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground tracking-wider"
                        >
                            Smartphone Reviews
                        </Link>
                        <Link
                            href="/how-to"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground tracking-wider"
                        >
                            How To
                        </Link>
                        <Link
                            href="/how-stuff-works"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground tracking-wider"
                        >
                            How Stuff Works
                        </Link>
                        <Link
                            href="/tech-kenya"
                            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground tracking-wider"
                        >
                            Tech Kenya
                        </Link>
                    </nav>

                    {/* Right: Theme Toggle - Only render after mount to prevent hydration mismatch */}
                    <div className="flex items-center gap-2 ml-auto md:ml-0">
                        {mounted ? (
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                                aria-label="Toggle theme"
                            >
                                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            </Button>
                        ) : (
                            <div className="h-10 w-10" />
                        )}
                    </div>
                </div>
            </header>

            {/* Left Sidebar / Drawer */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 flex">
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 bg-black/35 dark:bg-black/50"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Sidebar Content */}
                    <div className="relative w-3/4 max-w-xs border-r bg-white dark:bg-gray-950 p-6 shadow-lg animate-in slide-in-from-left duration-300">
                        <div className="flex items-center justify-between mb-8">
                            <Link href="/" className="flex items-baseline gap-0.5" onClick={() => setIsMenuOpen(false)}>
                                <span className="text-base font-black uppercase text-black dark:text-white leading-none">TECH</span>
                                <span className="text-base font-black uppercase bg-black text-white dark:bg-white dark:text-black px-1 py-0.5 leading-none">HUB</span>
                            </Link>
                            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(false)}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <nav className="flex flex-col">
                            <Link
                                href="/news"
                                className="text-lg font-medium transition-colors hover:text-brand-red border-b py-3 font-[family-name:var(--font-playfair)]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                News
                            </Link>
                            <Link
                                href="/reviews"
                                className="text-lg font-medium transition-colors hover:text-brand-red border-b py-3 font-[family-name:var(--font-playfair)]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Smartphone Reviews
                            </Link>
                            <Link
                                href="/how-to"
                                className="text-lg font-medium transition-colors hover:text-brand-red border-b py-3 font-[family-name:var(--font-playfair)]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                How To
                            </Link>
                            <Link
                                href="/how-stuff-works"
                                className="text-lg font-medium transition-colors hover:text-brand-red border-b py-3 font-[family-name:var(--font-playfair)]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                How Stuff Works
                            </Link>
                            <Link
                                href="/tech-kenya"
                                className="text-lg font-medium transition-colors hover:text-brand-red border-b py-3 font-[family-name:var(--font-playfair)]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Tech Kenya
                            </Link>
                            <Link
                                href="/contact"
                                className="text-lg font-medium transition-colors hover:text-brand-red border-b py-3 font-[family-name:var(--font-playfair)]"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Contact
                            </Link>
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
