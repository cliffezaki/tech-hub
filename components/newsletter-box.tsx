"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

interface NewsletterBoxProps {
    title: string
    text: string
    contactEmail: string
}

export function NewsletterBox({ title, text, contactEmail }: NewsletterBoxProps) {
    const [email, setEmail] = useState("")
    const [sent, setSent] = useState(false)
    const [message,setMessage]=useState("")
    const [busy,setBusy]=useState(false)

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = new FormData(event.currentTarget)
        setBusy(true)
        try {
            const r=await fetch("/api/public/subscribe",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,consent:true,websiteTrap:form.get("websiteTrap")})})
            const d=await r.json()
            if(!r.ok)throw Error(d.error)
            setSent(true);setMessage(d.message)
        } catch(e){setMessage(e instanceof Error?e.message:`Could not save your signup. Please contact ${contactEmail}.`)}
        finally{setBusy(false)}
    }

    return (
        <div className="rounded-xl bg-foreground p-6 text-background">
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-80">{text}</p>

            {sent ? (
                <p className="mt-4 text-sm opacity-90">
                    {message}
                </p>
            ) : (
                <form className="mt-4 flex flex-wrap gap-2" onSubmit={handleSubmit}>
                    <input name="websiteTrap" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
                    <label htmlFor="newsletter-email" className="sr-only">
                        Email address
                    </label>
                    <input
                        id="newsletter-email"
                        type="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                        className="w-full rounded-md border border-background/25 bg-background/10 px-3 py-2 text-sm placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-background/40"
                    />
                    <p className="w-full text-xs">By joining, you agree to receive Tech Hub email updates.</p>
                    <Button disabled={busy} type="submit" variant="secondary" size="sm" className="shrink-0">
                        Join
                    </Button>
                    <p role="status" className="w-full text-sm">{message}</p>
                </form>
            )}
        </div>
    )
}
