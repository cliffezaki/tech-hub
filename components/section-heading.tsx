import Link from "next/link"
import { ArrowRight } from "lucide-react"

interface SectionHeadingProps {
    title: string
    subtitle?: string
    href?: string
    linkLabel?: string
}

export function SectionHeading({ title, subtitle, href, linkLabel = "View all" }: SectionHeadingProps) {
    return (
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b pb-4">
            <div>
                <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
                {subtitle && <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{subtitle}</p>}
            </div>

            {href && (
                <Link
                    href={href}
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    {linkLabel}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
            )}
        </div>
    )
}
