/**
 * Dates are formatted with an explicit locale and UTC time zone so the server-rendered
 * markup matches what the browser renders (otherwise React reports a hydration mismatch).
 */
export function formatDate(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
    }).format(date)
}

export function formatDateTime(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "UTC",
    }).format(date)
}

/** "3 hours ago" style label, falling back to an absolute date after a week. */
export function formatRelativeDate(value: string) {
    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
        return ""
    }

    const diffMs = Date.now() - date.getTime()
    const diffMinutes = Math.round(diffMs / 60000)

    if (diffMinutes < 1) return "Just now"
    if (diffMinutes < 60) return `${diffMinutes} min ago`

    const diffHours = Math.round(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`

    const diffDays = Math.round(diffHours / 24)
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`

    return formatDate(value)
}

export function formatFileSize(bytes?: number) {
    if (!bytes) {
        return ""
    }

    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
