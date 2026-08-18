"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"

interface NewsletterBoxProps {
    title: string
    text: string
    contactEmail: string
}

/**
 * No mailing-list provider is wired up yet, so rather than pretending to subscribe
 * people the form opens a pre-filled email to the newsroom. Swapping in Mailchimp or
 * Buttondown later means replacing only the submit handler.
 */
export function NewsletterBox({ title, text, contactEmail }: NewsletterBoxProps) {
    const [email, setEmail] = useState("")
    const [sent, setSent] = useState(false)

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()

        const subject = encodeURIComponent("Newsletter signup")
        const body = encodeURIComponent(`Please add ${email} to the newsletter.`)
        window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
        setSent(true)
    }

    return (
        <div className="rounded-xl bg-foreground p-6 text-background">
            <h3 className="text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-relaxed opacity-80">{text}</p>

            {sent ? (
                <p className="mt-4 text-sm opacity-90">
                    Thanks — finish sending the email that just opened and you are on the list.
                </p>
            ) : (
                <form className="mt-4 flex gap-2" onSubmit={handleSubmit}>
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
                    <Button type="submit" variant="secondary" size="sm" className="shrink-0">
                        Join
                    </Button>
                </form>
            )}
        </div>
    )
}
