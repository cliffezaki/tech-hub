import Link from "next/link"
import { Linkedin, Mail, Twitter, Youtube } from "lucide-react"

import { getSiteSettings } from "@/lib/content"
import { readNavigation } from "@/lib/navigation"
import { publicItems } from "@/lib/menu-layout"

export async function Footer() {
    const [settings, navigation] = await Promise.all([
        getSiteSettings(),
        readNavigation(),
    ])
    const items = publicItems(navigation.layout,navigation.pages).filter(i => !i.hidden)
    const links = items.filter(i => i.menu === "footer")
    const sections = items.filter(i => i.menu === "sections")

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
                                {settings.siteName
                                    .split(" ")
                                    .slice(1)
                                    .join(" ") || "Hub"}
                            </span>
                        </Link>
                        <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                            {settings.footerText}
                        </p>

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
                        <h3 className="kicker text-muted-foreground">
                            Sections
                        </h3>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <Link
                                        href={section.href}
                                        className="text-muted-foreground transition-colors hover:text-foreground"
                                    >
                                        {section.name}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="kicker text-muted-foreground">More</h3>
                        <ul className="mt-4 space-y-2.5 text-sm">
                            {links.map((page) => (
                                    <li key={page.id}>
                                        <Link
                                            href={page.href}
                                            className="text-muted-foreground transition-colors hover:text-foreground"
                                        >
                                            {page.name}
                                        </Link>
                                    </li>
                                ))}
                        </ul>
                    </div>
                </div>

                <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t pt-6 text-sm text-muted-foreground sm:flex-row">
                    <p>
                        © {new Date().getFullYear()} {settings.siteName}. All
                        rights reserved.
                    </p>
                    <p>{settings.tagline}</p>
                </div>
            </div>
        </footer>
    )
}
