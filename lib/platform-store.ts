import "server-only"
import fs from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import {
    supabaseConfigured,
    supabaseAttempted,
    listSupabaseRecords,
    getSupabaseRecord,
    saveSupabaseRecord,
    deleteSupabaseRecord,
} from "@/lib/supabase-store"

// Personal and commercial data use private Supabase records; articles stay in Sanity.
const directory =
    process.env.CMS_TEST_DATA_DIR && process.env.NODE_ENV !== "production"
        ? process.env.CMS_TEST_DATA_DIR
        : path.join(process.cwd(), ".data", "platform")
const remote = supabaseConfigured
export function platformReady() {
    return (
        remote() ||
        (!supabaseAttempted() &&
            process.env.NODE_ENV !== "production" &&
            !process.env.VERCEL)
    )
}
function check() {
    if (!platformReady())
        throw new Error(
            "Private CMS storage is not configured. Set SUPABASE_URL and a server-only SUPABASE_SECRET_KEY."
        )
}
function key(collection: string, id: string) {
    if (!/^[a-zA-Z0-9_-]+$/.test(collection) || !/^[a-zA-Z0-9_-]+$/.test(id))
        throw new Error("Invalid record identifier")
    // Retain local filenames for existing development records.
    return `drafts.platform.${collection}.${id}`
}
export async function listRecords<T>(collection: string): Promise<T[]> {
    check()
    key(collection, "validate")
    if (remote()) return listSupabaseRecords<T>(collection)
    try {
        const names = await fs.readdir(directory)
        return await Promise.all(
            names
                .filter(
                    (n) =>
                        n.startsWith(`drafts.platform.${collection}.`) &&
                        n.endsWith(".json")
                )
                .map(async (n) =>
                    JSON.parse(
                        await fs.readFile(path.join(directory, n), "utf8")
                    )
                )
        )
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return []
        throw e
    }
}
export async function getRecord<T>(
    collection: string,
    id: string
): Promise<T | null> {
    check()
    const recordKey = key(collection, id)
    if (remote()) return getSupabaseRecord<T>(collection, id)
    try {
        return JSON.parse(
            await fs.readFile(path.join(directory, `${recordKey}.json`), "utf8")
        )
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return null
        throw e
    }
}
export async function saveRecord<T>(
    collection: string,
    id: string,
    value: T,
    createOnly = false
) {
    check()
    const recordKey = key(collection, id)
    if (remote()) return saveSupabaseRecord(collection, id, value, createOnly)
    else {
        await fs.mkdir(directory, { recursive: true, mode: 0o700 })
        const dest = path.join(directory, `${recordKey}.json`)
        if (createOnly)
            await fs.writeFile(dest, JSON.stringify(value), {
                flag: "wx",
                mode: 0o600,
            })
        else {
            const temp = `${dest}.${randomUUID()}.tmp`
            await fs.writeFile(temp, JSON.stringify(value), { mode: 0o600 })
            await fs.rename(temp, dest)
        }
    }
    return value
}
export async function deleteRecord(collection: string, id: string) {
    check()
    const recordKey = key(collection, id)
    if (remote()) await deleteSupabaseRecord(collection, id)
    else await fs.rm(path.join(directory, `${recordKey}.json`), { force: true })
}
export async function claim(collection: string, id: string, value: unknown) {
    try {
        await saveRecord(collection, id, value, true)
        return true
    } catch (e) {
        if (
            (e as NodeJS.ErrnoException).code === "EEXIST" ||
            (e as { code?: string }).code === "23505"
        )
            return false
        throw e
    }
}
