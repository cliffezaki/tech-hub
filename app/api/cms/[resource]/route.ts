import { NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import {
    authorized,
    audit,
    currentUser,
    emailId,
    hashPassword,
    sameOrigin,
    userPermissions,
} from "@/lib/accounts"
import {
    claim,
    deleteRecord,
    getRecord,
    listRecords,
    saveRecord,
} from "@/lib/platform-store"
import { MODULES, cleanRecord, type RecordData } from "@/lib/modules"
import {
    PERMISSIONS,
    ROLES,
    ROLE_PERMISSIONS,
    safeUser,
    type User,
    type Permission,
} from "@/lib/permissions"
import { revalidateSite } from "@/lib/api"

type Context = { params: Promise<{ resource: string }> }
const fail = (error: unknown, status = 400) =>
    NextResponse.json(
        { error: error instanceof Error ? error.message : String(error) },
        { status }
    )
const configResources = ["publishing", "advertising"]
export async function GET(request: Request, { params }: Context) {
    try {
        const { resource } = await params
        if (resource === "users" || resource === "subscribers") {
            if (
                !(await authorized(
                    resource === "users" ? "users.manage" : "subscribers.manage"
                ))
            )
                return fail("Not authorized", 403)
            const users = await listRecords<User>("users")
            return NextResponse.json(
                resource === "users"
                    ? users.map(safeUser)
                    : users
                          .filter((u) => u.subscribed)
                          .map((u) => ({
                              id: u.id,
                              name: u.name,
                              email: u.email,
                              createdAt: u.createdAt,
                          }))
            )
        }
        if (resource === "roles") {
            if (!(await authorized("users.manage")))
                return fail("Not authorized", 403)
            return NextResponse.json(
                (await getRecord("config", "roles")) || ROLE_PERMISSIONS
            )
        }
        if (resource === "audit") {
            if (!(await authorized("settings.manage")))
                return fail("Not authorized", 403)
            return NextResponse.json(
                (await listRecords<{ at: string }>("audit"))
                    .sort((a, b) => b.at.localeCompare(a.at))
                    .slice(0, 100)
            )
        }
        const definition = MODULES[resource]
        if (!definition) return fail("Not found", 404)
        if (!(await authorized(definition.permission)))
            return fail("Not authorized", 403)
        if (configResources.includes(resource)) {
            const config = await getRecord("config", resource)
            return NextResponse.json(config ? [config] : [])
        }
        return NextResponse.json(await listRecords(resource))
    } catch (e) {
        return fail(e, 503)
    }
}
export async function POST(request: Request, { params }: Context) {
    try {
        if (!(await sameOrigin())) return fail("Invalid origin", 403)
        const { resource } = await params
        const actor = await currentUser()
        if (!actor) return fail("Sign in first", 401)
        const body = await request.json()
        const permissions = await userPermissions(actor)
        if (resource === "users") {
            if (!permissions.includes("users.manage"))
                return fail("Not authorized", 403)
            const email = String(body.email || "")
                .trim()
                .toLowerCase()
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                return fail("Enter a valid email")
            const id = emailId(email)
            const previous = await getRecord<User>("users", id)
            if (
                previous?.role === "owner" ||
                body.role === "owner" ||
                email === process.env.OWNER_EMAIL?.toLowerCase()
            )
                return fail(
                    "The owner account is protected. Use Account to edit your own profile.",
                    403
                )
            if (!ROLES.includes(body.role)) return fail("Invalid role")
            const granted = Array.isArray(body.permissions)
                ? body.permissions.filter((p: Permission) =>
                      PERMISSIONS.includes(p)
                  )
                : []
            const denied = Array.isArray(body.deniedPermissions)
                ? body.deniedPermissions.filter((p: Permission) =>
                      PERMISSIONS.includes(p)
                  )
                : []
            if (actor.role !== "owner")
                return fail(
                    "Only the owner can assign roles or permissions.",
                    403
                )
            const user: User = {
                id,
                email,
                name: String(body.name || email).slice(0, 100),
                role: body.role,
                status: body.status === "suspended" ? "suspended" : "active",
                permissions: granted,
                deniedPermissions: denied,
                passwordHash: body.password
                    ? await hashPassword(body.password)
                    : previous?.passwordHash || "",
                sessionVersion: (previous?.sessionVersion || 0) + 1,
                createdAt: previous?.createdAt || new Date().toISOString(),
                subscribed: previous?.subscribed || false,
            }
            if (!user.passwordHash)
                return fail(
                    "A temporary password of at least 12 characters is required for a new user."
                )
            await saveRecord("users", id, user, !previous)
            await audit(actor.id, "user.save", id)
            return NextResponse.json(safeUser(user))
        }
        if (resource === "roles") {
            if (actor.role !== "owner")
                return fail("Only the owner can manage roles", 403)
            const roles = { ...ROLE_PERMISSIONS }
            for (const role of ROLES.filter((r) => r !== "owner"))
                if (Array.isArray(body[role]))
                    roles[role] = body[role].filter((p: Permission) =>
                        PERMISSIONS.includes(p)
                    )
            await saveRecord("config", "roles", roles)
            await audit(actor.id, "roles.save", "roles")
            return NextResponse.json(roles)
        }
        const definition = MODULES[resource]
        if (!definition) return fail("Not found", 404)
        if (!permissions.includes(definition.permission))
            return fail("Not authorized", 403)
        const id = configResources.includes(resource)
            ? resource
            : String(body.id || randomUUID())
        const collection = configResources.includes(resource)
            ? "config"
            : resource
        const previous = await getRecord<RecordData>(collection, id)
        const data: RecordData = {
            ...cleanRecord(definition, body),
            id,
            createdAt: previous?.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }
        if (
            resource === "navigation" &&
            (!String(data.href).startsWith("/") ||
                String(data.href).startsWith("//"))
        )
            return fail("Navigation links must be local paths.")
        if (resource === "creatives")
            for (const key of ["imageUrl", "mobileImageUrl"])
                if (
                    data[key] &&
                    !/^(https?:\/\/|\/(?!\/))/.test(String(data[key]))
                )
                    return fail(
                        "Creative images must use a web URL or local path."
                    )
        if (resource === "campaigns") {
            if (!(await claim("locks", "campaigns", { at: Date.now() })))
                return fail(
                    "Another campaign is being saved. Retry shortly.",
                    409
                )
            try {
                if (
                    !data.start ||
                    !data.end ||
                    String(data.end) < String(data.start)
                )
                    return fail("Choose a valid start and end date.")
                const live = ["active", "scheduled"].includes(
                    String(data.status)
                )
                if (
                    (live ||
                        (previous &&
                            ["active", "scheduled"].includes(
                                String(previous.status)
                            ))) &&
                    !permissions.includes("ads.publish")
                )
                    return fail(
                        "Publishing or changing live campaigns requires ad publishing permission.",
                        403
                    )
                const placement = await getRecord<RecordData>(
                    "placements",
                    String(data.placementId)
                )
                if (
                    !placement ||
                    !(await getRecord(
                        "advertisers",
                        String(data.advertiserId)
                    )) ||
                    !(await getRecord("creatives", String(data.creativeId)))
                )
                    return fail(
                        "Choose an existing advertiser, placement, and creative."
                    )
                if (live && placement.exclusive) {
                    const conflicts = (
                        await listRecords<RecordData>("campaigns")
                    ).filter(
                        (c) =>
                            c.id !== id &&
                            c.placementId === data.placementId &&
                            ["active", "scheduled"].includes(
                                String(c.status)
                            ) &&
                            String(c.start) <= String(data.end) &&
                            String(c.end) >= String(data.start)
                    )
                    if (conflicts.length)
                        return fail(
                            `Scheduling conflict with ${conflicts.map((c) => c.name).join(", ")}.`,
                            409
                        )
                }
                await saveRecord(collection, id, data)
            } finally {
                await deleteRecord("locks", "campaigns")
            }
        } else {
            if (
                resource === "placements" &&
                previous &&
                !permissions.includes("ads.publish")
            )
                return fail(
                    "Changing a placement also requires ad publishing permission.",
                    403
                )
            if (
                resource === "creatives" &&
                previous &&
                (await listRecords<RecordData>("campaigns")).some(
                    (c) =>
                        c.creativeId === id &&
                        ["active", "scheduled"].includes(String(c.status))
                ) &&
                !permissions.includes("ads.publish")
            )
                return fail(
                    "Editing a live creative requires publishing permission.",
                    403
                )
            await saveRecord(collection, id, data)
        }
        await audit(actor.id, `${resource}.save`, id)
        revalidateSite()
        return NextResponse.json(data)
    } catch (e) {
        return fail(e)
    }
}
export async function DELETE(request: Request, { params }: Context) {
    try {
        if (!(await sameOrigin())) return fail("Invalid origin", 403)
        const { resource } = await params
        const id = new URL(request.url).searchParams.get("id") || ""
        const actor = await currentUser()
        if (!actor) return fail("Sign in first", 401)
        if (resource === "users") {
            if (actor.role !== "owner")
                return fail("Only the owner can remove users", 403)
            const user = await getRecord<User>("users", id)
            if (!user || user.role === "owner")
                return fail("This account cannot be removed", 403)
        } else {
            const definition = MODULES[resource]
            if (!definition || configResources.includes(resource))
                return fail("Not found", 404)
            const permissions = await userPermissions(actor)
            if (
                !permissions.includes(definition.permission) ||
                ([
                    "campaigns",
                    "creatives",
                    "placements",
                    "advertisers",
                ].includes(resource) &&
                    !permissions.includes("ads.delete"))
            )
                return fail("Not authorized", 403)
            if (
                ["creatives", "placements", "advertisers"].includes(resource) &&
                (await listRecords<RecordData>("campaigns")).some(
                    (c) =>
                        c[
                            resource === "creatives"
                                ? "creativeId"
                                : resource === "placements"
                                  ? "placementId"
                                  : "advertiserId"
                        ] === id
                )
            )
                return fail(
                    "This record is referenced by campaign history. Disable it instead.",
                    409
                )
        }
        await deleteRecord(resource, id)
        await audit(actor.id, `${resource}.delete`, id)
        revalidateSite()
        return NextResponse.json({ ok: true })
    } catch (e) {
        return fail(e)
    }
}
