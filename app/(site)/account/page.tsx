"use client"
import { useEffect, useState } from "react"
import Link from "next/link"
import type { User } from "@/lib/permissions"
import { AccountSettings } from "./account-settings"
import styles from "./account.module.css"
export default function AccountPage() {
    const [user, setUser] = useState<Omit<User, "passwordHash"> | null>(null)
    const [staff, setStaff] = useState(false)
    const [mode, setMode] = useState("login")
    const [message, setMessage] = useState("")
    const [busy, setBusy] = useState(false)
    const [ready, setReady] = useState(false)
    const [resetToken, setResetToken] = useState("")
    const [invalidCredentials, setInvalidCredentials] = useState(false)
    function changeMode(nextMode: string) {
        setMode(nextMode)
        setMessage("")
        setInvalidCredentials(false)
    }
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
        setInvalidCredentials(false)
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
            if (!response.ok) {
                // Only the login endpoint's credential rejection reveals recovery.
                // Network errors, rate limits and profile errors must not do so.
                setInvalidCredentials(!user && mode === "login" && response.status === 401)
                throw new Error(result.error)
            }
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
    if (user) return <AccountSettings user={user} staff={staff} onSaved={setUser} />
    return (
        <div className={styles.account}>
            <p className="kicker text-brand-red">Your Tech Hub</p>
            <h1 className={styles.heading}>
                {user
                    ? "Your account"
                    : mode === "login"
                      ? "Welcome back"
                      : mode === "register"
                        ? "Join the conversation"
                        : "Reset your password"}
            </h1>
            <p className={styles.intro}>
                Read, subscribe, and manage your work from one account.
            </p>
            {message && (
                <div className={styles.notice}>
                    <p id="account-message" role={invalidCredentials ? "alert" : "status"}>{message}</p>
                    {!user && mode === "login" && invalidCredentials && (
                        <button type="button" className={styles.textLink} disabled={busy} onClick={() => changeMode("forgot")}>
                            Forgot password?
                        </button>
                    )}
                </div>
            )}
            {!ready ? (
                <p>Loading account…</p>
            ) : (
                <form key={mode} onSubmit={submit} className={styles.form} aria-busy={busy}>
                    {(user || mode === "register") && (
                        <label className="block">
                            Name
                            <input
                                className="cms-input"
                                name="name"

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
                                aria-invalid={invalidCredentials || undefined}
                                aria-describedby={invalidCredentials ? "account-message" : undefined}
                                required
                            />
                        </label>
                    )}
                    {mode !== "forgot" && (
                        <label className="block">
                            {user ? "New password (optional)" : "Password"}
                            <input
                                className="cms-input"
                                name="password"
                                type="password"
                                aria-invalid={invalidCredentials || undefined}
                                aria-describedby={invalidCredentials ? "account-message" : undefined}
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
                    {(user || mode === "register") && (
                        <label className="flex items-center gap-3">
                            <input
                                name="subscribed"
                                type="checkbox"

                            />
                            I want to subscribe to Tech Hub updates.
                        </label>
                    )}
                    <button type="submit" className={styles.primary} disabled={busy}>
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
            {
                ready && <p className={styles.switchMode}>
                    {mode === "login" ? (
                        <>Don&apos;t have an account?{" "}<button type="button" className={styles.textLink} disabled={busy} onClick={() => changeMode("register")}>Sign up</button></>
                    ) : (
                        <>{mode === "register" ? "Already have an account? " : "Remember your password? "}<button type="button" className={styles.textLink} disabled={busy} onClick={() => changeMode("login")}>Back to log in</button></>
                    )}
                </p>
            }
        </div>
    )
}
