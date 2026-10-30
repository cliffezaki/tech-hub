"use client"
import { useEffect, useState } from "react"
import {
    PERMISSIONS,
    ROLES,
    ROLE_PERMISSIONS,
    type User,
    type Permission,
    type Role,
} from "@/lib/permissions"
type PublicUser = Omit<User, "passwordHash">
export function UserManager({
    subscribersOnly = false,
}: {
    subscribersOnly?: boolean
}) {
    const [users, setUsers] = useState<PublicUser[]>([])
    const [editing, setEditing] = useState<Partial<PublicUser> | null>(null)
    const [message, setMessage] = useState("")
    const [roles, setRoles] = useState(ROLE_PERMISSIONS)
    const [role, setRole] = useState<Role>("author")
    const [busy, setBusy] = useState(false)
    async function load() {
        const r = await fetch(
            `/api/cms/${subscribersOnly ? "subscribers" : "users"}`
        )
        const d = await r.json()
        if (!r.ok) throw new Error(d.error)
        setUsers(d)
    }
    useEffect(() => {
        fetch(`/api/cms/${subscribersOnly ? "subscribers" : "users"}`)
            .then((r) => r.json())
            .then((d) => (Array.isArray(d) ? setUsers(d) : setMessage(d.error)))
        if (!subscribersOnly)
            fetch("/api/cms/roles")
                .then((r) => r.json())
                .then((d) => {
                    if (!d.error) setRoles(d)
                })
    }, [subscribersOnly])
    async function submit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setBusy(true)
        const form = new FormData(e.currentTarget)
        try {
            const r = await fetch("/api/cms/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...Object.fromEntries(form),
                    permissions: form.getAll("permissions"),
                    deniedPermissions: form.getAll("deniedPermissions"),
                }),
            })
            const d = await r.json()
            if (!r.ok) throw new Error(d.error)
            await load()
            setEditing(null)
            setMessage("User saved. Previous sessions were revoked.")
        } catch (e) {
            setMessage((e as Error).message)
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="space-y-6">
            <div className="flex justify-between">
                <div>
                    <h1 className="text-3xl font-bold">
                        {subscribersOnly ? "Subscribers" : "Users & roles"}
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {subscribersOnly
                            ? "Readers who opted into updates. Newsletter delivery is not yet connected."
                            : "Control your team’s access. The owner always retains full control."}
                    </p>
                </div>
                {!subscribersOnly && (
                    <button
                        className="cms-primary"
                        onClick={() =>
                            setEditing({ role: "reader", status: "active" })
                        }
                    >
                        Add user
                    </button>
                )}
            </div>
            {message && (
                <p role="status" className="rounded border p-4">
                    {message}
                </p>
            )}
            {editing && (
                <form
                    onSubmit={submit}
                    key={editing.id || "new"}
                    className="space-y-4 rounded-xl border bg-background p-6"
                >
                    <div className="grid gap-4 md:grid-cols-2">
                        <label>
                            Name
                            <input
                                className="cms-input"
                                name="name"
                                defaultValue={editing.name}
                                required
                            />
                        </label>
                        <label>
                            Email
                            <input
                                className="cms-input"
                                name="email"
                                type="email"
                                defaultValue={editing.email}
                                readOnly={!!editing.id}
                                required
                            />
                        </label>
                        <label>
                            Role
                            <select
                                className="cms-input"
                                name="role"
                                defaultValue={editing.role}
                            >
                                {ROLES.filter((r) => r !== "owner").map((r) => (
                                    <option key={r}>{r}</option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Status
                            <select
                                className="cms-input"
                                name="status"
                                defaultValue={editing.status}
                            >
                                <option>active</option>
                                <option>suspended</option>
                            </select>
                        </label>
                        <label className="md:col-span-2">
                            {editing.id
                                ? "New password (optional; resets all sessions)"
                                : "Temporary password"}
                            <input
                                className="cms-input"
                                type="password"
                                name="password"
                                minLength={12}
                                required={!editing.id}
                                autoComplete="new-password"
                            />
                        </label>
                    </div>
                    <details>
                        <summary className="cursor-pointer font-semibold">
                            Individual permission overrides
                        </summary>
                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                            {PERMISSIONS.map((p) => (
                                <div
                                    key={p}
                                    className="rounded border p-3 text-xs"
                                >
                                    <p className="mb-2 font-semibold">{p}</p>
                                    <label className="mr-3">
                                        <input
                                            type="checkbox"
                                            name="permissions"
                                            value={p}
                                            defaultChecked={editing.permissions?.includes(
                                                p
                                            )}
                                        />{" "}
                                        Grant
                                    </label>
                                    <label>
                                        <input
                                            type="checkbox"
                                            name="deniedPermissions"
                                            value={p}
                                            defaultChecked={editing.deniedPermissions?.includes(
                                                p
                                            )}
                                        />{" "}
                                        Deny
                                    </label>
                                </div>
                            ))}
                        </div>
                    </details>
                    <button className="cms-primary" disabled={busy}>
                        Save user
                    </button>
                    <button
                        type="button"
                        className="ml-5"
                        onClick={() => setEditing(null)}
                    >
                        Cancel
                    </button>
                </form>
            )}
            <div className="overflow-x-auto rounded-xl border bg-background">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr>
                            <th className="p-4">Name</th>
                            <th>Email</th>
                            {!subscribersOnly && (
                                <>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((u) => (
                            <tr className="border-t" key={u.id}>
                                <td className="p-4">{u.name}</td>
                                <td>{u.email}</td>
                                {!subscribersOnly && (
                                    <>
                                        <td>{u.role}</td>
                                        <td>{u.status}</td>
                                        <td>
                                            {u.role !== "owner" && (
                                                <>
                                                    <button
                                                        className="mr-4 underline"
                                                        onClick={() =>
                                                            setEditing(u)
                                                        }
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="text-red-600"
                                                        onClick={async () => {
                                                            if (
                                                                !confirm(
                                                                    "Remove this user? Their articles will be preserved."
                                                                )
                                                            )
                                                                return
                                                            const r =
                                                                await fetch(
                                                                    `/api/cms/users?id=${u.id}`,
                                                                    {
                                                                        method: "DELETE",
                                                                    }
                                                                )
                                                            const d =
                                                                await r.json()
                                                            if (!r.ok)
                                                                setMessage(
                                                                    d.error
                                                                )
                                                            else await load()
                                                        }}
                                                    >
                                                        Remove
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
                {!users.length && (
                    <p className="p-8 text-center text-muted-foreground">
                        No accounts to display.
                    </p>
                )}
            </div>
            {!subscribersOnly && (
                <details className="rounded-xl border bg-background p-6">
                    <summary className="cursor-pointer text-lg font-semibold">
                        Role permission defaults
                    </summary>
                    <select
                        aria-label="Role"
                        className="cms-input max-w-xs"
                        value={role}
                        onChange={(e) => setRole(e.target.value as Role)}
                    >
                        {ROLES.filter((r) => r !== "owner").map((r) => (
                            <option key={r}>{r}</option>
                        ))}
                    </select>
                    <div className="my-5 grid gap-3 md:grid-cols-2">
                        {PERMISSIONS.map((p) => (
                            <label key={p} className="text-sm">
                                <input
                                    type="checkbox"
                                    className="mr-2"
                                    checked={roles[role].includes(p)}
                                    onChange={(e) =>
                                        setRoles({
                                            ...roles,
                                            [role]: e.target.checked
                                                ? [...roles[role], p]
                                                : roles[role].filter(
                                                      (v: Permission) => v !== p
                                                  ),
                                        })
                                    }
                                />
                                {p}
                            </label>
                        ))}
                    </div>
                    <button
                        className="cms-primary"
                        onClick={async () => {
                            const r = await fetch("/api/cms/roles", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(roles),
                            })
                            const d = await r.json()
                            setMessage(r.ok ? "Role defaults saved." : d.error)
                        }}
                    >
                        Save role defaults
                    </button>
                </details>
            )}
        </div>
    )
}
