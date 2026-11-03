"use client"
import { useEffect, useState } from "react"
import { PasswordField } from "@/components/password-field"
import type { User } from "@/lib/permissions"
import { AccountSettings } from "./account-settings"
import styles from "./account.module.css"
export default function AccountPage() {
    const [user, setUser] = useState<Omit<User, "passwordHash"> | null>(null)
    const [verification, setVerification] = useState<{challenge: string; expiresAt: number; resendAt: number} | null>(null)
    const [clock, setClock] = useState(0)
    useEffect(() => {
        const timer = setInterval(() => setClock(Date.now()), 1000)
        return () => clearInterval(timer)
    }, [])
    const cooldown = verification ? Math.max(0, Math.ceil((verification.resendAt - clock) / 1000)) : 0
    async function resend() {
        if (!verification || busy) return
        setBusy(true)
        setMessage("Sending another verification email…")
        try {
            const response = await fetch("/api/auth/resend-verification", {
                method: "POST", signal: AbortSignal.timeout(60000), headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ challenge: verification.challenge }),
            })
            const result = await response.json()
            if (!response.ok) throw new Error(result.error)
            setVerification(result)
            setClock(result.resendAt - 60000)
            setMessage(result.message)
        } catch (error) { setMessage((error as Error).name === "TimeoutError" ? "Email delivery is taking longer than expected. Check your inbox before retrying." : (error as Error).message) }
        finally { setBusy(false) }
    }
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
        const params = new URLSearchParams(location.hash.slice(1))
        const newsletter = params.get("newsletter")
        const verify = params.get("verify") || newsletter
        const token = verify || params.get("reset")
        if (token) {
            // Read and immediately remove the email token from the browser fragment.
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setResetToken(token)
            setMode(newsletter ? "verify-newsletter" : verify ? "verify" : "reset")
            history.replaceState(null, "", location.pathname + location.search)
        }
        fetch("/api/auth/me", { signal: AbortSignal.timeout(15000) })
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
                ["reset", "register"].includes(mode) &&
                form.get("password") !== form.get("confirmPassword")
            )
                throw new Error("Passwords do not match.")
            const response = await fetch(
                `/api/auth/${user ? "profile" : mode}`,
                {
                    method: "POST",
                    signal: AbortSignal.timeout(60000),
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        ...Object.fromEntries(form),
                        token: resetToken,
                        challenge: verification?.challenge,
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
                if (mode === "register") {
                    setVerification(result)
                    setClock(result.resendAt - 60000)
                    setMode("verify-code")
                }
                if (mode === "reset" || mode.startsWith("verify")) {
                    setResetToken("")
                    setMode(mode === "verify" || mode === "verify-code" ? "complete" : "login")
                    setVerification(null)
                }
            }
        } catch (e) {
            setMessage((e as Error).name === "TimeoutError" ? "The request took too long. Please check your inbox for a verification email before trying again." : (e as Error).message)
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
                        : mode === "complete" ? "Registration complete" : mode.startsWith("verify") ? "Confirm your email" : "Reset your password"}
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
            ) : mode === "complete" ? (
                <button type="button" className={styles.primary} onClick={() => changeMode("login")}>Sign in to your account</button>
            ) : (
                <form key={mode} onSubmit={submit} className={styles.form} aria-busy={busy}>
                    {mode === "verify-code" && <>
                        <p>Enter the six-digit code from your email, or open the confirmation link. Codes expire after 30 minutes. Verification does not sign you in automatically.</p>
                        <label className="block">Verification code
                            <input className="cms-input" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} required aria-describedby="code-help" />
                        </label>
                        <p id="code-help">{verification && clock >= verification.expiresAt ? "This code has expired. Start registration again." : "Check your spam folder if the email has not arrived."}</p>
                        <button type="button" className={styles.textLink} disabled={busy || cooldown > 0} onClick={resend}>{cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}</button>
                    </>}
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
                    {!user && mode !== "reset" && !mode.startsWith("verify") && (
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
                    {mode !== "forgot" && !mode.startsWith("verify") && <PasswordField label="Password" name="password" required minLength={mode === "login" ? 1 : 12} autoComplete={mode === "login" ? "current-password" : "new-password"} strength={mode !== "login"} />}
                    {["reset", "register"].includes(mode) && <PasswordField label="Confirm password" name="confirmPassword" required minLength={12} autoComplete="new-password" />}
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
                        {busy && <span className={styles.spinner} aria-hidden="true" />}
                        {busy
                            ? (mode === "register" ? "Creating account and sending verification email…" : "Please wait…")
                            : user
                              ? "Save profile"
                              : mode === "login"
                                ? "Log in"
                                : mode === "forgot"
                                  ? "Request password reset"
                                  : mode === "reset"
                                    ? "Save new password"
                                    : mode.startsWith("verify") ? "Confirm email" : "Create account"}
                    </button>
                </form>
            )}
            {
                ready && mode !== "complete" && <p className={styles.switchMode}>
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
