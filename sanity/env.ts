export const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2024-12-27"

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"

export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || ""

/** Server-only. Required for the dashboard to save content; never exposed to the browser. */
export const writeToken = process.env.SANITY_API_WRITE_TOKEN || ""

export const useCdn = false

/**
 * The whole app switches storage driver on this: with a real project id the CMS talks to
 * Sanity (which works on serverless hosting), without one it falls back to local JSON files.
 */
export function isSanityConfigured() {
    return Boolean(projectId && projectId !== "your-project-id")
}
