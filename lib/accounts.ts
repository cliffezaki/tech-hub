import "server-only"
import { scrypt, randomBytes, createHash, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import { cookies, headers } from "next/headers"
import { getRecord, saveRecord, claim } from "@/lib/platform-store"
import {
    permissionsFor,
    ROLE_PERMISSIONS,
    type User,
    type Permission,
    type Role,
} from "@/lib/permissions"
import { SESSION_COOKIE, readSession } from "@/lib/auth"
const derive = promisify(scrypt)
export const emailId = (email: string) =>
    createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
export async function hashPassword(password: string) {
    if (password.length < 12 || password.length > 256)
        throw new Error("Use a password between 12 and 256 characters.")
    const salt = randomBytes(16).toString("hex")
    return `${salt}:${((await derive(password, salt, 64)) as Buffer).toString("hex")}`
}
export async function checkPassword(password: string, hash: string) {
    if (password.length > 256) return false
    const [salt, hex] = hash.split(":")
    const expected = Buffer.from(hex || "", "hex")
    const actual = (await derive(password, salt || "invalid", 64)) as Buffer
    return (
        expected.length === actual.length && timingSafeEqual(expected, actual)
    )
}
export async function currentUser(): Promise<User | null> {
    const session = await readSession(
        (await cookies()).get(SESSION_COOKIE)?.value
    )
    if (!session) return null
    const user = await getRecord<User>("users", session.id)
    return user &&
        user.status === "active" &&
        user.sessionVersion === session.version
        ? user
        : null
}
export async function userPermissions(user: User) {
    const roles = await getRecord<Record<Role, Permission[]>>("config", "roles")
    return permissionsFor(
        user,
        roles ? { ...ROLE_PERMISSIONS, ...roles } : ROLE_PERMISSIONS
    )
}
export async function authorized(permission?: Permission) {
    const user = await currentUser()
    if (!user) return null
    const permissions = await userPermissions(user)
    return (
        permission
            ? permissions.includes(permission) ||
              (permission === "articles.editOwn" &&
                  permissions.includes("articles.editAll"))
            : permissions.length > 0
    )
        ? user
        : null
}
export async function sameOrigin() {
    const h = await headers()
    const origin = h.get("origin")
    return Boolean(origin && new URL(origin).host === h.get("host"))
}
export async function throttle(scope: string, limit = 8) {
    const key = emailId(`${scope}:${Math.floor(Date.now() / 900000)}`)
    for (let i = 0; i < limit; i++)
        if (
            await claim("limits", `${key}-${i}`, {
                expiresAt: Date.now() + 900000,
            })
        )
            return true
    return false
}
export async function audit(userId: string, action: string, target: string) {
    await saveRecord("audit", randomBytes(16).toString("hex"), {
        userId,
        action,
        target,
        at: new Date().toISOString(),
    })
}
