/* eslint-disable @next/next/no-img-element */
import type { SiteSettings } from "@/lib/types"
export type LogoSettings = Pick<SiteSettings, "siteName" | "logoLight" | "logoDark" | "logoSame" | "logoWidth">
export function SiteLogo({ settings, small = false }: { settings: LogoSettings; small?: boolean }) {
    const [first, ...rest] = settings.siteName.trim().split(/\s+/)
    const light = settings.logoLight
    const dark = settings.logoSame === "false" ? settings.logoDark || light : light
    const fallback = <span className={`flex items-baseline gap-0.5 font-black uppercase leading-none tracking-tight ${small ? "text-lg" : "text-xl md:text-2xl"}`}><span>{first}</span>{rest.length > 0 && <span className="bg-foreground px-1.5 py-1 text-background">{rest.join(" ")}</span>}</span>
    if (!light && !dark) return fallback
    const width = Math.min(180, Math.max(80, Number(settings.logoWidth) || 150))
    return <span className="inline-block max-w-[32vw] align-middle" style={{ width }}>
        <span className="block dark:hidden">{light ? <img src={light} alt={settings.siteName} className="h-10 w-full object-contain object-left" /> : fallback}</span>
        <span className="hidden dark:block">{dark ? <img src={dark} alt={settings.siteName} className="h-10 w-full object-contain object-left" /> : fallback}</span>
    </span>
}
