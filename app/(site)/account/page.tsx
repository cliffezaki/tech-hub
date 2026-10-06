"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import type { User } from "@/lib/permissions"
export default function AccountPage() {
    const [user, setUser] = useState<Omit<User, "passwordHash"> | null>(null)
    const [staff, setStaff] = useState(false)
    const [mode, setMode] = useState("login")
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    const [ready, setReady] = useState(false)
    const [resetToken, setResetToken] = useState("")
    useEffect(() => {
        const token = new URLSearchParams(location.hash.slice(1)).get("reset")
        if (token) {
            setResetToken(token)
            setMode("reset")
            history.replaceState(null, "", location.pathname + location.search)
        }
        fetch("/api/auth/me")
            .then((r) => r.json())
            .then((d) => {
                setUser(token ? null : d.user)
                setStaff(d.permissions?.length > 0)
                setReady(true)
                if (!d.configured)
                    setMessage(
                        "Accounts are awaiting configuration by the site owner."
                    )
            })
            .catch(() => {
                setReady(true)
                setMessage("Account service is unavailable.")
            })
    }, [])
    async function submit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setBusy(true)
        setMessage("")
        const form = new FormData(event.currentTarget)
        try {
            if (
                mode === "reset" &&
                form.get("password") !== form.get("confirmPassword")
            )
                throw new Error("Passwords do not match.")
            const response = await fetch(
                `/api/auth/${user ? "profile" : mode}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...Object.fromEntries(form),
                        token: resetToken,
                        subscribed: form.get("subscribed") === "on",
                    }),
                }
            )
            const result = await response.json()
            if (!response.ok) throw new Error(result.error)
            if (result.redirect) location.assign(result.redirect)
            else {
                setMessage(result.message)
                if (result.user) setUser(result.user)
                if (mode === "reset") {
                    setResetToken("")
                    setMode("login")
                }
            }
        } catch (e) {
            setMessage((e as Error).message)
        } finally {
            setBusy(false)
        }
    }
    return (
        <div className="mx-auto max-w-xl px-5 py-16">
            <p className="kicker text-brand-red">Your Tech Hub</p>
            <h1 className="mt-3 text-4xl font-bold">
                {user
                    ? "Your account"
                    : mode === "login"
                      ? "Welcome back"
                      : mode === "register"
                        ? "Join the conversation"
                        : mode === "setup"
                          ? "Set up the owner account"
                          : "Reset your password"}
            </h1>
            <p className="mt-3 text-muted-foreground">
                Read, subscribe, and manage your work from one account.
            </p>
            {message && (
                <p role="status" className="my-5 rounded border p-4">
                    {message}
                </p>
            )}
            {!ready ? (
                <p>Loading account…</p>
            ) : (
                <form key={mode} onSubmit={submit} className="mt-7 space-y-5">
                    {(user || ["register", "setup"].includes(mode)) && (
                        <label className="block">
                            Name
                            <input
                                className="cms-input"
                                name="name"
                                defaultValue={user?.name}
                                required
                                maxLength={100}
                            />
                        </label>
                    )}
                    {!user && mode !== "reset" && (
                        <label className="block">
                            Email
                            <input
                                className="cms-input"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                            />
                        </label>
                    )}
                    {user && (
                        <>
                            <p>
                                {user.email} · {user.role}
                            </p>
                            <label className="block">
                                Current password (to change password)
                                <input
                                    className="cms-input"
                                    name="currentPassword"
                                    type="password"
                                    autoComplete="current-password"
                                />
                            </label>
                        </>
                    )}
                    {mode !== "forgot" && (
                        <label className="block">
                            {user ? "New password (optional)" : "Password"}
                            <input
                                className="cms-input"
                                name="password"
                                type="password"
                                autoComplete={
                                    mode === "login"
                                        ? "current-password"
                                        : "new-password"
                                }
                                required={!user}
                                minLength={mode === "login" ? 1 : 12}
                                maxLength={256}
                            />
                        </label>
                    )}
                    {mode === "reset" && (
                        <label className="block">
                            Confirm new password
                            <input
                                className="cms-input"
                                name="confirmPassword"
                                type="password"
                                autoComplete="new-password"
                                required
                                minLength={12}
                                maxLength={256}
                            />
                        </label>
                    )}
                    {mode === "setup" && (
                        <label className="block">
                            Owner setup token
                            <input
                                className="cms-input"
                                name="setupToken"
                                type="password"
                                required
                            />
                        </label>
                    )}
                    {(user || ["register", "setup"].includes(mode)) && (
                        <label className="flex items-center gap-3">
                            <input
                                name="subscribed"
                                type="checkbox"
                                defaultChecked={user?.subscribed}
                            />
                            I want to subscribe to Tech Hub updates.
                        </label>
                    )}
                    <button className="cms-primary" disabled={busy}>
                        {busy
                            ? "Working…"
                            : user
                              ? "Save profile"
                              : mode === "login"
                                ? "Log in"
                                : mode === "forgot"
                                  ? "Request password reset"
                                  : mode === "reset"
                                    ? "Save new password"
                                    : "Create account"}
                    </button>
                </form>
            )}
            {user ? (
                <div className="mt-6 flex gap-5">
                    {staff && (
                        <Link href="/admin" className="underline">
                            Open publishing dashboard
                        </Link>
                    )}
                    <button
                        onClick={async () => {
                            await fetch("/api/auth/logout", { method: "POST" })
                            location.assign("/account")
                        }}
                    >
                        Log out
                    </button>
                </div>
            ) : (
                <div className="mt-7 flex flex-wrap gap-4 text-sm">
                    {[
                        ["login", "Log in"],
                        ["register", "Sign up"],
                        ["forgot", "Forgot password?"],
                        ["setup", "Owner setup"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            className="underline"
                            onClick={() => {
                                setMode(value)
                                setMessage("")
                            }}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
