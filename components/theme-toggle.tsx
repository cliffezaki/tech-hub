"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"

const subscribe = () => () => {}
const clientSnapshot = () => true
const serverSnapshot = () => false

export function ThemeToggle() {
    const mounted = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot)
    const { resolvedTheme, setTheme, forcedTheme } = useTheme()
    const dark = resolvedTheme === "dark"

    return (
        <button
            type="button"
            role="switch"
            aria-label="Dark mode"
            aria-checked={mounted && dark}
            disabled={!mounted || Boolean(forcedTheme)}
            title={mounted ? `Switch to ${dark ? "light" : "dark"} mode` : "Color theme"}
            className="theme-toggle"
            onClick={() => setTheme(dark ? "light" : "dark")}
        >
            <span className="theme-toggle-track" aria-hidden="true">
                <span className="theme-toggle-thumb" />
                <Sun className="theme-toggle-sun" size={16} />
                <Moon className="theme-toggle-moon" size={16} />
            </span>
        </button>
    )
}
