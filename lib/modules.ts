import type { Permission } from "./permissions"
export type RecordData = {
    id: string
    updatedAt?: string
    createdAt?: string
    [key: string]: string | number | boolean | undefined
}
export type Field = {
    key: string
    label: string
    type?:
        | "text"
        | "textarea"
        | "email"
        | "url"
        | "number"
        | "date"
        | "checkbox"
        | "select"
    options?: string[]
    required?: boolean
}
export type Module = {
    title: string
    description: string
    permission: Permission
    fields: Field[]
}
const f = (
    key: string,
    label: string,
    type: Field["type"] = "text",
    required = false
): Field => ({ key, label, type, required })
const select = (key: string, label: string, options: string[]): Field => ({
    key,
    label,
    type: "select",
    options,
})
export const MODULES: Record<string, Module> = {
    categories: {
        title: "Categories",
        description:
            "Manage your editorial categories. Existing article categories remain intact.",
        permission: "categories.manage",
        fields: [
            f("name", "Category name", "text", true),
            f("description", "Description", "textarea"),
        ],
    },
    navigation: {
        title: "Navigation / menus",
        description:
            "Links appear in ascending order. Use local paths such as /news. Hide links without deleting their pages.",
        permission: "menus.manage",
        fields: [
            f("name", "Label", "text", true),
            f("href", "Page path", "text", true),
            select("menu", "Menu", ["main", "footer"]),
            f("order", "Order", "number"),
            f("hidden", "Hide this link", "checkbox"),
        ],
    },
    comments: {
        title: "Comments",
        description: "Review reader comments before publication.",
        permission: "comments.moderate",
        fields: [
            f("name", "Reader"),
            f("articleId", "Article ID"),
            f("message", "Comment", "textarea"),
            select("status", "Status", [
                "pending",
                "approved",
                "rejected",
                "spam",
            ]),
        ],
    },
    advertisers: {
        title: "Advertisers",
        description: "Private contact details and campaign relationships.",
        permission: "ads.advertisers",
        fields: [
            f("name", "Company", "text", true),
            f("contact", "Contact person"),
            f("email", "Email", "email"),
            f("phone", "Phone"),
            f("website", "Website", "url"),
            select("status", "Status", ["active", "inactive"]),
            f("notes", "Internal notes", "textarea"),
        ],
    },
    campaigns: {
        title: "Campaigns",
        description:
            "Dates are inclusive (UTC). Scheduling conflicts in exclusive placements are blocked. Paused and draft campaigns never display.",
        permission: "ads.campaigns",
        fields: [
            f("name", "Campaign name", "text", true),
            f("advertiserId", "Advertiser ID", "text", true),
            select("status", "Status", [
                "draft",
                "scheduled",
                "active",
                "paused",
                "completed",
                "cancelled",
            ]),
            f("objective", "Objective"),
            f("start", "Start date", "date", true),
            f("end", "End date", "date", true),
            f("placementId", "Placement ID", "text", true),
            f("creativeId", "Creative ID", "text", true),
            f("notes", "Internal notes", "textarea"),
        ],
    },
    placements: {
        title: "Ad placements",
        description:
            "Supported positions: homepage-top, homepage-middle, header, article-top, article-middle, article-bottom, sidebar, news, reviews, how-stuff-works, footer. Empty placements collapse automatically.",
        permission: "ads.settings",
        fields: [
            f("name", "Placement name", "text", true),
            select("slot", "Position", [
                "homepage-top",
                "homepage-middle",
                "header",
                "article-top",
                "article-middle",
                "article-bottom",
                "sidebar",
                "news",
                "reviews",
                "how-stuff-works",
                "footer",
            ]),
            f("enabled", "Enabled", "checkbox"),
            f("exclusive", "Exclusive placement", "checkbox"),
            f(
                "paths",
                "Limit to paths or sections (comma separated, optional)"
            ),
        ],
    },
    creatives: {
        title: "Ad creatives",
        description:
            "Use images from Media. External scripts and raw embeds are disabled; image and text ads do not require third-party tracking.",
        permission: "ads.campaigns",
        fields: [
            f("name", "Creative name", "text", true),
            f("imageUrl", "Desktop image URL"),
            f("mobileImageUrl", "Mobile image URL"),
            f("alt", "Image description"),
            f("text", "Ad text", "textarea"),
            f("cta", "Call to action"),
            f("destination", "Destination URL", "url", true),
        ],
    },
    inquiries: {
        title: "Advertising inquiries",
        description: "Inquiries submitted from Advertise With Us appear here.",
        permission: "ads.inquiries",
        fields: [
            f("name", "Name", "text", true),
            f("company", "Company"),
            f("email", "Email", "email", true),
            f("phone", "Phone"),
            f("website", "Website", "url"),
            f("format", "Advertising interest"),
            f("budget", "Estimated budget"),
            f("start", "Preferred start", "date"),
            f("end", "Preferred end", "date"),
            f("audience", "Target audience"),
            f("message", "Message", "textarea"),
            select("status", "Status", [
                "new",
                "contacted",
                "negotiating",
                "converted",
                "closed",
                "spam",
            ]),
        ],
    },
    packages: {
        title: "Advertising packages",
        description:
            "Publish packages and optionally show pricing. Currency and prices are always entered by your team.",
        permission: "ads.settings",
        fields: [
            f("name", "Package name", "text", true),
            f("description", "Description", "textarea"),
            f("placements", "Included placements"),
            f("duration", "Duration"),
            f("price", "Price", "number"),
            f("currency", "Currency (e.g. KES)"),
            f("publicPrice", "Show price publicly", "checkbox"),
            f("available", "Available", "checkbox"),
        ],
    },
    revenue: {
        title: "Campaign revenue",
        description:
            "Manual records only. Creating a campaign does not record a payment. Amounts are reported separately by currency.",
        permission: "ads.revenue",
        fields: [
            f("name", "Record description", "text", true),
            f("campaignId", "Campaign ID", "text", true),
            f("advertiserId", "Advertiser ID"),
            f("date", "Date", "date", true),
            f("currency", "Currency", "text", true),
            f("value", "Contract value", "number"),
            f("invoiced", "Amount invoiced", "number"),
            f("paid", "Amount received", "number"),
            f("reference", "Payment / invoice reference"),
            f("notes", "Notes", "textarea"),
        ],
    },
    publishing: {
        title: "Publishing & privacy settings",
        description:
            "These settings control account registration, comments, tracking consent, and publication defaults. Email and external analytics remain unconfigured until connected.",
        permission: "settings.manage",
        fields: [
            f("name", "Configuration label"),
            f("registration", "Allow reader registration", "checkbox"),
            f("comments", "Enable moderated comments", "checkbox"),
            f(
                "analytics",
                "Enable consent-based first-party analytics",
                "checkbox"
            ),
            f("language", "Language"),
            f("defaultAuthor", "Default author"),
            f("defaultCategory", "Default category"),
            f("favicon", "Favicon URL"),
            f("description", "Default meta description", "textarea"),
            f("socialImage", "Social sharing image URL"),
            f("noIndex", "Prevent search indexing", "checkbox"),
        ],
    },
    advertising: {
        title: "Advertising settings",
        description:
            "Choose your media kit and which measured audience totals may be shared publicly.",
        permission: "ads.settings",
        fields: [
            f("name", "Configuration label"),
            f("mediaKit", "Media kit URL (upload a PDF in Media)"),
            f(
                "showViews",
                "Show measured page views from last 30 days",
                "checkbox"
            ),
            f("showSubscribers", "Show current subscriber total", "checkbox"),
        ],
    },
}
export function cleanRecord(
    module: Module,
    input: Record<string, unknown>
): Record<string, string | number | boolean> {
    const output: Record<string, string | number | boolean> = {}
    for (const field of module.fields) {
        const value = input[field.key]
        if (field.type === "checkbox") output[field.key] = value === true
        else if (field.type === "number") {
            const n = Number(value || 0)
            if (!Number.isFinite(n) || n < 0)
                throw new Error(`${field.label} must be a non-negative number.`)
            output[field.key] = n
        } else {
            const text = String(value || "").trim()
            if (text.length > (field.type === "textarea" ? 12000 : 1000))
                throw new Error(`${field.label} is too long.`)
            if (field.required && !text)
                throw new Error(`${field.label} is required.`)
            if (text && field.type === "url" && !/^https?:\/\//i.test(text))
                throw new Error(
                    `${field.label} must start with https:// or http://.`
                )
            if (
                text &&
                field.type === "email" &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
            )
                throw new Error("Enter a valid email.")
            if (
                text &&
                field.type === "date" &&
                !/^\d{4}-\d{2}-\d{2}$/.test(text)
            )
                throw new Error("Invalid date.")
            if (field.options && !field.options.includes(text))
                throw new Error(`Choose a valid ${field.label.toLowerCase()}.`)
            output[field.key] = text
        }
    }
    return output
}
