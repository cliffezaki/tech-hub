import "server-only"

import { isSanityConfigured } from "@/sanity/env"
import { createFileStore } from "./file-store"
import { createSanityStore } from "./sanity-store"
import type { ContentStore } from "./types"

let cached: ContentStore | null = null

/**
 * Returns the active content store. Sanity wins whenever it is configured, because it is
 * the only one of the two that can persist content on a serverless host.
 */
export function getStore(): ContentStore {
    if (!cached) {
        cached = isSanityConfigured() ? createSanityStore() : createFileStore()
    }

    return cached
}

export interface StoreStatus {
    mode: ContentStore["mode"]
    writable: boolean
    /** Human-readable explanation shown in the dashboard when saving is unavailable. */
    reason?: string
}

export function getStoreStatus(): StoreStatus {
    const store = getStore()

    if (store.writable) {
        return { mode: store.mode, writable: true }
    }

    return {
        mode: store.mode,
        writable: false,
        reason:
            store.mode === "sanity"
                ? "Sanity is connected but SANITY_API_WRITE_TOKEN is missing, so changes cannot be saved. Add the token in your hosting environment variables."
                : "This deployment has no CMS database connected. Content is read from files bundled at build time and cannot be edited here. Connect Sanity to enable editing on the live site.",
    }
}

export type { ContentStore } from "./types"
