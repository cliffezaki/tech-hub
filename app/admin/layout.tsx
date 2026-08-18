import type { Metadata } from "next"

export const metadata: Metadata = {
    // The root layout appends the site name, so this is just the page part.
    title: "Dashboard",
    // Keep the dashboard out of search results even when it is reachable.
    robots: { index: false, follow: false },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return children
}
