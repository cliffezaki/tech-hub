import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

import { cn } from "@/lib/utils"

/**
 * Renders article and page bodies. Markdown is the one body format the dashboard reads
 * and writes, so this is the single place article typography is defined.
 */
export function Markdown({ content, className }: { content: string; className?: string }) {
    if (!content?.trim()) {
        return <p className="italic text-muted-foreground">No content has been added to this article yet.</p>
    }

    return (
        <div
            className={cn(
                "prose prose-neutral max-w-none dark:prose-invert",
                "prose-headings:font-[family-name:var(--font-playfair)] prose-headings:tracking-tight",
                "prose-h2:mt-10 prose-h2:mb-4 prose-h2:text-2xl md:prose-h2:text-3xl",
                "prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-xl",
                "prose-p:leading-[1.75] prose-p:text-[1.0625rem] md:prose-p:text-lg",
                "prose-li:leading-[1.7] prose-li:marker:text-brand-red",
                "prose-a:text-brand-red prose-a:underline-offset-4 hover:prose-a:opacity-80",
                "prose-blockquote:border-l-brand-red prose-blockquote:not-italic prose-blockquote:font-medium",
                "prose-strong:text-foreground prose-img:rounded-lg",
                className
            )}
        >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
    )
}
