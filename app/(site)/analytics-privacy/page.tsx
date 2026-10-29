import Link from "next/link"
import { AnalyticsPrivacyChoice } from "@/components/analytics-privacy-choice"
export const metadata = { title: "Audience measurement & privacy" }
export default function AnalyticsPrivacyPage() {
    return <article className="site-container mx-auto max-w-3xl space-y-6 py-12">
        <h1 className="text-3xl font-bold">Audience measurement &amp; privacy</h1>
        <p>Tech Hub measures how often pages are read, which topics are popular and which sources bring readers here. These anonymous measurements help us improve our coverage and describe our audience to advertisers.</p>
        <p>We record page paths without query strings, referring website domains, broad device and browser categories, and approximate country and region supplied by our hosting provider. Measurements also include advertising impressions and clicks. Records contain the calendar day and a random event reference used to prevent duplicate counting.</p>
        <p>We do not create tracking cookies or persistent browser identifiers for these measurements. We do not store IP addresses, full browser user-agent strings, exact location, names, email addresses, age or gender in analytics records. Our hosting provider processes network information to deliver the site and supply approximate geography. Network addresses are also processed briefly in server memory to limit abusive submissions.</p>
        <p>Counts represent recorded page views and ad interactions, not unique people. VPNs and mobile networks can affect geography. Advertising reports are aggregate measurements and are not independently audited. Older measurements may have no geography; records collected before this change used consent-based browser identifiers.</p>
        <p>We respect browser Do Not Track and Global Privacy Control signals, previous declined analytics choices, and the preference below. Blocking scripts can also prevent measurements. Your choice here is stored only in this browser and does not create a tracking identifier.</p>
        <AnalyticsPrivacyChoice />
        <p>Liking a story does not require an account. When you like, we save a first-party cookie for up to one year to prevent accidental repeat likes from the same browser. This identifier is used for likes, not audience tracking. Comments show your chosen name and message; optional email addresses remain private. Newsletter signups are recorded separately from contact messages.</p>
        <p>Sign-in, subscriptions, comments and advertising inquiries use information you submit for those services. For privacy questions or requests, <Link className="underline" href="/contact">contact the publisher</Link>.</p>
    </article>
}
