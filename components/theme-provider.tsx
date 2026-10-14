"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
    children,
    ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
    React.useEffect(() => {
        // Enable color motion only after the pre-paint theme script has run.
        const frame = requestAnimationFrame(() => document.documentElement.classList.add("theme-ready"));
        return () => {
            cancelAnimationFrame(frame);
            document.documentElement.classList.remove("theme-ready");
        };
    }, []);
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
