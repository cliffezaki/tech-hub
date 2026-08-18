import type { Metadata } from "next"
import { Mail, MessageSquare, PenTool } from "lucide-react"

import { ContactForm } from "@/components/contact-form"
import { Card } from "@/components/ui/card"
import { getSiteSettings } from "@/lib/content"

export const metadata: Metadata = {
    title: "Contact",
    description: "Get in touch with the newsroom — story tips, review requests, and advertising.",
}

export default async function ContactPage() {
    const settings = await getSiteSettings()

    const routes = [
        {
            icon: PenTool,
            title: "Story tips",
            text: "Working on something we should cover? Send the details and how to reach you.",
        },
        {
            icon: MessageSquare,
            title: "Review requests",
            text: "Hardware and software makers can request a hands-on review.",
        },
        {
            icon: Mail,
            title: "Advertising",
            text: "Sponsorships, partnerships, and everything commercial.",
        },
    ]

    return (
        <div className="site-container py-12 md:py-16">
            <header className="mx-auto max-w-3xl text-center">
                <p className="kicker text-brand-red">Contact</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Get in touch</h1>
                <p className="mt-4 text-lg text-muted-foreground">
                    Tips, corrections, review requests, or partnership ideas — the newsroom reads everything.
                </p>
            </header>

            <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-5">
                <div className="space-y-4 lg:col-span-2">
                    {routes.map((route) => {
                        const Icon = route.icon
                        return (
                            <Card key={route.title} className="p-5">
                                <Icon className="h-5 w-5 text-brand-red" />
                                <h2 className="mt-3 text-lg font-bold">{route.title}</h2>
                                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{route.text}</p>
                            </Card>
                        )
                    })}

                    {settings.contactEmail && (
                        <p className="px-1 text-sm text-muted-foreground">
                            Prefer email?{" "}
                            <a href={`mailto:${settings.contactEmail}`} className="font-medium text-foreground hover:text-brand-red">
                                {settings.contactEmail}
                            </a>
                        </p>
                    )}
                </div>

                <Card className="p-6 lg:col-span-3">
                    <h2 className="text-xl font-bold">Send a message</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        This opens your email app with the message ready to send.
                    </p>
                    <ContactForm contactEmail={settings.contactEmail} />
                </Card>
            </div>
        </div>
    )
}
