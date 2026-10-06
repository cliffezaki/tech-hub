# Publishing CMS rollout

This change extends the existing Next.js app, article/page stores and public URLs. It does not migrate or delete existing content, seed accounts, or deploy the site. Existing sample articles in the repository remain unchanged.

## Required configuration

1. Retain the existing Sanity public content configuration.
2. Create a **separate private Sanity dataset**, e.g. `cms-private`, in the same project. Set server-only `CMS_PRIVATE_DATASET` to its name. Give `SANITY_API_WRITE_TOKEN` access to this dataset and the content dataset. Never prefix secrets or the private dataset setting with `NEXT_PUBLIC_`.
3. Set `ADMIN_SESSION_SECRET` to a randomly generated secret of at least 32 characters.
4. Set `OWNER_EMAIL` to your actual owner email and `OWNER_SETUP_TOKEN` to a different random secret of at least 32 characters.
5. Open `/account`, choose **Owner setup**, and enter that email, setup token, your name and a new password of at least 12 characters. Remove `OWNER_SETUP_TOKEN` after setup. Public signup always creates readers and cannot claim the reserved owner email.
6. The old `ADMIN_PASSWORD` login and unauthenticated local admin access are retired. Existing shared-password cookies do not work with individual accounts. There was no existing user database to migrate.

Local development keeps private data in `.data/platform`, ignored by Git. Production account/commercial writes require the private dataset; they never fall back to an ephemeral serverless filesystem. Records also use Sanity's draft namespace as an extra anonymous-read safeguard. Do not publish these private records through Sanity Studio. The custom CMS manages them without duplicating content schemas.

## Included workflows

- Registration, individual password login, profiles, subscription preferences, logout/session invalidation, owner setup, roles and individual permission overrides. Server-side permission checks apply independently of hidden menus.
- Authors/contributors create and edit owned drafts. Editors manage others' work; publishing, unpublishing, deletion and promotion are checked. Existing articles without ownership remain editor/owner-managed until an ownership migration is chosen.
- Private draft preview, duplication, publication actions, scoped pins, numeric order, featured stories and visible sponsorship disclosure.
- Existing page inventory with virtual defaults, editable section introductions, About/Contact/Advertise content, draft Privacy/Terms entries, duplicate route protection, and editable menus. Built-in routes are unpublished rather than deleted.
- Moderated comments and subscriber records. Newsletter delivery is not connected.
- Private advertiser, creative, placement, campaign, inquiry, package and revenue records. Image/text creatives reuse Media, including PDF media kits. Campaign delivery uses inclusive UTC dates and collapses empty slots. Campaign saves reject overlapping exclusive schedules. A crashed save can leave `locks/campaigns`; remove that lock only after confirming no save is running.
- Consent-based page/ad measurements, date ranges, browser/device/referrer breakdowns, author performance, and campaign CSV export. No demographics, location, payment, or audience totals are fabricated. Browser IDs do not count identifiable people. Reports are not audited billable metrics.

## Before production use

- Review and publish your actual Privacy Policy and Terms. The privacy draft requires your business contact, retention and legal review. No third-party tracking scripts are installed.
- Password-reset email delivery is **unconfigured**. Automatic approval review rejected adding Resend without approval of the provider and the email/reset-token payload. The UI reports that state. The owner can reset non-owner passwords in Users; self-service reset remains to be connected after choosing an email provider.
- Private Sanity access and hosting environment variables still need live validation. Tests exercise the local private store, not your live datasets.
- Review the dependency audit for the existing lockfile. This change does not silently upgrade framework or CMS dependencies.
- Inquiry protection includes validation, consent, honeypot and email-based throttles. Add a configured edge rate limiter/challenge service before high-volume public use.
- Schedule retention/cleanup for old rate-limit, audit and analytics records. Reports currently load stored events; production scale requires date-indexed queries/aggregation or a dedicated analytics adapter. This first-party collector is not yet high-volume analytics infrastructure.

## Remaining scope

This is a reviewable first implementation, not every item in the full brief. Remaining enhancements: self-service password reset; email verification/newsletter delivery; geography/session engagement provider integration; advanced homepage layout builders; full category rename propagation; ownership reassignment UI; move-button/drag-and-drop ordering; logo/time-zone/date-format and pagination controls; richer advertiser asset libraries and revenue summaries; invoicing/payments; and production retention/abuse controls. Raw HTML/script ads are disabled. Sidebar placements need final template/design integration.

## Verification

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:cms`. The HTTP suite starts a temporary development instance on port 3137 and stores test accounts/content under a fresh OS temporary directory. It does not write test users or campaigns into repository content or production. Run builds separately from the test server.

Main, public hosting, and existing content are not changed until this branch is reviewed and deployed.
