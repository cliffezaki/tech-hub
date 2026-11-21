import type { SiteSettings } from "@/lib/types"
export const IDENTITY_IMAGES = ["logoLight", "logoDark", "iconSource", "icon16", "icon32", "icon180", "icon192", "icon512", "iconIco", "socialImage"] as const
export const ICON_FIELDS = ["iconSource", "icon16", "icon32", "icon180", "icon192", "icon512", "iconIco"] as const
export function versionedIcon(url: string, version: string) {
    return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(version || "default")}`
}
export function siteIcon(settings: SiteSettings, size: 16 | 32 | 180 | 192 | 512 = 32) {
    return versionedIcon(settings[`icon${size}`] || "/site-icon.svg", settings.identityVersion)
}
