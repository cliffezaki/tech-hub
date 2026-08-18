"use client"

import { useState } from "react"
import { Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * Hands the message to the visitor's email client. That keeps the site free of a mail
 * provider and API keys; swap this handler for a POST once a service is chosen.
 */
export function ContactForm({ contactEmail }: { contactEmail: string }) {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" })
    const [sent, setSent] = useState(false)

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault()

        const subject = encodeURIComponent(form.subject || `Message from ${form.name || "a reader"}`)
        const body = encodeURIComponent(`${form.message}\n\n—\n${form.name}\n${form.email}`)
        window.location.href = `mailto:${contactEmail}?subject=${subject}&body=${body}`
        setSent(true)
    }

    if (sent) {
        return (
            <div className="mt-6 rounded-lg border border-dashed p-6 text-center">
                <p className="font-medium">Your email app should now be open.</p>
                <p className="mt-1 text-sm text-muted-foreground">Send the message and we will get back to you.</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setSent(false)}>
                    Write another message
                </Button>
            </div>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                        id="name"
                        value={form.name}
                        onChange={(event) => setForm({ ...form, name: event.target.value })}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) => setForm({ ...form, email: event.target.value })}
                        required
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                    id="subject"
                    value={form.subject}
                    onChange={(event) => setForm({ ...form, subject: event.target.value })}
                    placeholder="Story tip, review request, advertising…"
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                    id="message"
                    value={form.message}
                    onChange={(event) => setForm({ ...form, message: event.target.value })}
                    rows={6}
                    required
                />
            </div>

            <Button type="submit" className="w-full">
                <Send className="mr-2 h-4 w-4" />
                Send message
            </Button>
        </form>
    )
}
