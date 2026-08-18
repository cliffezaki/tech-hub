import Link from "next/link"
import { Linkedin, Mail, Twitter, Youtube } from "lucide-react"

import { getPublishedPages, getSiteSettings } from "@/lib/content"
import { ARTICLE_SECTIONS, SECTION_META } from "@/lib/types"

export async function Footer() {
    const [settings, pages] = await Promise.all([getSiteSettings(), getPublishedPages()])

    const socials = [
        { href: settings.twitterUrl, label: "X", icon: Twitter },
        { href: settings.linkedinUrl, label: "LinkedIn", icon: Linkedin },
        { href: settings.youtubeUrl, label: "YouTube", icon: Youtube },
    ].filter((social) => social.href)

    return (
        <footer className="mt-20 border-t bg-muted/30">
            <div className="site-container py-14">
                <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-baseline gap-0.5">
                            <span className="text-lg font-black uppercase leading-none">
                                {settings.siteName.split(" ")[0]}
                            </span>
                            <span className="bg-foreground px-1.5 py-1 text-lg font-black uppercase leading-none text-background">
                                {settings.siteName.split(" ").slice(1).join(" ") || "Hub"}
                            </span>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{settings.footerText}</p>

                        {(socials.length > 0 || settings.contactEmail) && (
                            <div className="mt-5 flex items-center gap-2">
                                {socials.map((social) => {
                                    const Icon = social.icon
                                    return (
                                        <a
                                            key={social.label}
                                            href={social.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={social.label}
                                            className="rounded-full border p-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                                        >
                                            <Icon className="h-4 w-4" />
                                        </a>
                                    )
                                })}
                                {settings.contactEmail && (
                                    <a
                                        href={`mailto:${settings.contactEmail}`}
                                        aria-label="Email us"
                                        className="rounded-full border p-2 text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                                    >
                                        <Mail className="h-4 w-4" />
                                    </a>
                                )}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="kicker text-muted-foreground">Sections</h3>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {ARTICLE_SECTIONS.map((section) => (
                                <li key={section}>
                                    <Link href={`/${section}`} className="text-muted-foreground transition-colors hover:text-foreground">
                                        {SECTION_META[section].label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="kicker text-muted-foreground">More</h3>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {pages.map((page) => (
                                <li key={page.id}>
                                    <Link href={`/${page.slug}`} className="text-muted-foreground transition-colors hover:text-foreground">
                                        {page.title}
                                    </Link>
                                </li>
                            ))}
                            <li>
                                <Link href="/contact" className="text-muted-foreground transition-colors hover:text-foreground">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link href="/search" className="text-muted-foreground transition-colors hover:text-foreground">
                                    Search
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
                    <p>
                        © {new Date().getFullYear()} {settings.siteName}. All rights reserved.
                    </p>
                    <p>{settings.tagline}</p>
                </div>
            </div>
        </footer>
    )
}
