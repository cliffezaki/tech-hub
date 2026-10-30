/** Public byline routes contain no private user ids, email addresses or account records. */
export function authorSlug(name: string) {
    const text = name.trim().toLowerCase().normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    return text || `author-${Array.from(name).map(c => c.codePointAt(0)!.toString(16)).join("-")}`
}
export const authorHref = (name: string) => `/authors/${authorSlug(name)}`
