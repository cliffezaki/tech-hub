import "server-only"
import fs from "node:fs/promises"
import path from "node:path"
import { randomUUID } from "node:crypto"
import { createClient } from "next-sanity"
import {
    isSanityConfigured,
    projectId,
    apiVersion,
    writeToken,
} from "@/sanity/env"

// Personal and commercial data must use a separate private dataset, never public content.
const directory =
    process.env.CMS_TEST_DATA_DIR && process.env.NODE_ENV !== "production"
        ? process.env.CMS_TEST_DATA_DIR
        : path.join(process.cwd(), ".data", "platform")
const remote = () =>
    isSanityConfigured() &&
    Boolean(process.env.CMS_PRIVATE_DATASET && writeToken)
function client() {
    if (!remote())
        throw new Error(
            "Configure a private CMS_PRIVATE_DATASET and SANITY_API_WRITE_TOKEN."
        )
    return createClient({
        projectId,
        dataset: process.env.CMS_PRIVATE_DATASET!,
        apiVersion,
        token: writeToken,
        useCdn: false,
        perspective: "raw",
    })
}
export function platformReady() {
    return (
        remote() ||
        (process.env.NODE_ENV !== "production" && !process.env.VERCEL)
    )
}
function check() {
    if (!platformReady())
        throw new Error(
            "Private CMS storage is not configured. Set CMS_PRIVATE_DATASET and SANITY_API_WRITE_TOKEN."
        )
}
function key(collection: string, id: string) {
    if (!/^[a-zA-Z0-9_-]+$/.test(collection) || !/^[a-zA-Z0-9_-]+$/.test(id))
        throw new Error("Invalid record identifier")
    // Draft namespace adds protection against anonymous reads if the dataset is misconfigured.
    return `drafts.platform.${collection}.${id}`
}
export async function listRecords<T>(collection: string): Promise<T[]> {
    check()
    key(collection, "validate")
    if (remote())
        return (
            await client().fetch<{ payload: string }[]>(
                `*[_type == "platformRecord" && collection == $collection]`,
                { collection }
            )
        ).map((d) => JSON.parse(d.payload))
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
    if (remote()) {
        const doc = await client().getDocument<{ payload: string }>(recordKey)
        return doc ? JSON.parse(doc.payload) : null
    }
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
    if (remote()) {
        const doc = {
            _id: recordKey,
            _type: "platformRecord",
            collection,
            payload: JSON.stringify(value),
        }
        if (createOnly) await client().create(doc)
        else await client().createOrReplace(doc)
    } else {
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
    if (remote()) await client().delete(recordKey)
    else await fs.rm(path.join(directory, `${recordKey}.json`), { force: true })
}
export async function claim(collection: string, id: string, value: unknown) {
    try {
        await saveRecord(collection, id, value, true)
        return true
    } catch (e) {
        if (
            (e as NodeJS.ErrnoException).code === "EEXIST" ||
            (e as { statusCode?: number }).statusCode === 409
        )
            return false
        throw e
    }
}
