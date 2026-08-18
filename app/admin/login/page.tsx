"use client"

import { Suspense, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Loader2, Lock } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [password, setPassword] = useState("")
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            })

            if (response.ok) {
                const next = searchParams.get("next") || "/admin"
                router.push(next)
                router.refresh()
                return
            }

            const data = await response.json().catch(() => ({}))
            setError(data.error || "Sign in failed.")
        } catch {
            setError("Sign in failed. Check your connection and try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 rounded-xl border bg-background p-8 shadow-sm">
            <div className="space-y-2 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-muted">
                    <Lock className="h-5 w-5" />
                </div>
                <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold">Dashboard sign in</h1>
                <p className="text-sm text-muted-foreground">Enter the dashboard password to manage content.</p>
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoFocus
                    required
                />
            </div>

            {error && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                    {error}
                </p>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign in
            </Button>

            <p className="text-center text-xs text-muted-foreground">
                <Link href="/" className="hover:text-foreground">
                    Back to the site
                </Link>
            </p>
        </form>
    )
}

export default function AdminLoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
            <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />}>
                <LoginForm />
            </Suspense>
        </div>
    )
}
