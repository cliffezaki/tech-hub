import { authorized } from "@/lib/accounts"
import { resetConfigurationIssues } from "@/lib/password-reset"

const recoveryMessages: Record<string, string> = {
    SMTP_USER_INVALID: "The Gmail sender address is missing or invalid.",
    SMTP_PASSWORD_INVALID: "The Gmail app password is missing or invalid. Enter a 16-character Google app password privately in the hosting settings.",
    EMAIL_PROVIDER_INVALID: "The email provider setting is invalid.",
    RESEND_API_KEY_MISSING: "The email provider key is missing.",
    RESEND_FROM_EMAIL_MISSING: "The email sender setting is missing.",
    SITE_URL_INVALID: "The website address must be a valid HTTPS address.",
}
export default async function Layout({
    children,
}: {
    children: React.ReactNode
}) {
    if (!(await authorized("settings.manage")))
        return <p>You do not have access to this section.</p>
    const issues = resetConfigurationIssues()
    return <>
        <section aria-label="Password-reset email setup" className="rounded-xl border bg-background p-5">
            <h2 className="font-semibold">Password-reset emails</h2>
            <p className="mt-2 text-sm text-muted-foreground">
                {issues.length ? "Email recovery needs the following setup corrections:" : "Email settings are present. A successful inbox-delivery test is still required."}
            </p>
            {issues.length > 0 && <ul className="mt-3 list-disc space-y-2 pl-5 text-sm">
                {issues.map(issue => <li key={issue}>{recoveryMessages[issue] || "Check the email configuration."} <code className="text-xs text-muted-foreground">({issue})</code></li>)}
            </ul>}
            <p className="mt-3 text-xs text-muted-foreground">Visible only to settings managers. Passwords and provider keys are never displayed here.</p>
        </section>
        {children}
    </>
}
