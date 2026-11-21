# Publishing CMS rollout

This change extends the existing Next.js app, article/page stores and public URLs. It does not migrate or delete existing content, seed accounts, or deploy the site. Existing sample articles in the repository remain unchanged.

## Required configuration

1. Retain the existing Sanity public content configuration.
2. Create a **Supabase Free project for staging**, then run `supabase/cms-records.sql` once in its SQL editor. The table blocks anonymous and browser-authenticated access; only the website server uses it. Set server-only `SUPABASE_URL` to the project's HTTPS URL and `SUPABASE_SECRET_KEY` to its secret API key (`sb_secret_...`). Never prefix the key with `NEXT_PUBLIC_`, use a publishable key for this backend, or store credentials in Git. `SANITY_API_WRITE_TOKEN` remains for articles/pages/media only. `CMS_PRIVATE_DATASET` is no longer used.
3. Set `ADMIN_SESSION_SECRET` to a randomly generated secret of at least 32 characters.
4. Retain the existing private owner account. Open `/account` and sign in with its email and password. Owner permissions come from that authenticated record's stored role, not an email environment variable.
5. Public signup always creates readers. There is no public owner-registration interface or backend endpoint. `OWNER_EMAIL` and `OWNER_SETUP_TOKEN` are retired. A separate empty environment needs a trusted offline owner migration with a scrypt password hash, never plaintext or a public signup flow.
6. The old `ADMIN_PASSWORD` login and unauthenticated local admin access are retired. Existing shared-password cookies do not work with individual accounts. There was no existing user database to migrate.

Local development keeps private data in `.data/platform`, ignored by Git, only when Supabase is entirely unconfigured. Production account/commercial writes require Supabase; invalid or unavailable database configuration never falls back to files. Existing articles/pages/media stay in Sanity. This branch does not migrate private records from an older Sanity deployment; no deployed private CMS records were created during this setup.

## Preview isolation

Use branch-specific Preview variables in Vercel for `codex/publishing-cms-advertising`; exclude Production. In Sanity create a separate public content dataset such as `staging` and set this branch's `NEXT_PUBLIC_SANITY_DATASET` to it, so publishing tests do not edit live articles. Copy existing public content into staging or populate staging deliberately; do not run demo seeding against production. Use a separate Supabase staging project and session secret. Set `NEXT_PUBLIC_SITE_URL` to the stable HTTPS preview address. Keep the PR as a draft until these services are configured and live tests pass.

[Supabase Free](https://supabase.com/pricing) currently includes a 500 MB database and up to two active projects. Free projects can pause after one week of inactivity; automatic backups are not included. These limits are suitable for staging, and production backup/availability needs should be reviewed before rollout. This avoids Sanity's paid private-dataset requirement while retaining Sanity for content.

## Included workflows

- Reader registration, individual password login, profiles, subscription preferences, logout/session invalidation, stored roles and individual permission overrides. Server-side permission checks apply independently of hidden menus. Existing Owner accounts cannot be demoted or edited through the user-management API; profile/password changes use the authenticated Account screen.
- Authors/contributors create and edit owned drafts. Editors manage others' work; publishing, unpublishing, deletion and promotion are checked. Existing articles without ownership remain editor/owner-managed until an ownership migration is chosen.
- Private draft preview, duplication, publication actions, scoped pins, numeric order, featured stories and visible sponsorship disclosure.
- Existing page inventory with virtual defaults, editable section introductions, About/Contact/Advertise content, draft Privacy/Terms entries, duplicate route protection, and editable menus. Built-in routes are unpublished rather than deleted.
- Moderated comments and subscriber records. Newsletter delivery is not connected.
- Private advertiser, creative, placement, campaign, inquiry, package and revenue records. Image/text creatives reuse Media, including PDF media kits. Campaign delivery uses inclusive UTC dates and collapses empty slots. Campaign saves reject overlapping exclusive schedules. A crashed save can leave `locks/campaigns`; remove that lock only after confirming no save is running.
- Consent-based page/ad measurements, date ranges, browser/device/referrer breakdowns, author performance, and campaign CSV export. No demographics, location, payment, or audience totals are fabricated. Browser IDs do not count identifiable people. Reports are not audited billable metrics.

## Before production use

- Review and publish your actual Privacy Policy and Terms. The privacy draft requires your business contact, retention and legal review. No third-party tracking scripts are installed.
- Password-reset email supports the selected dedicated Gmail account: configure server-only `MAIL_PROVIDER=gmail`, `SMTP_USER` and `SMTP_PASSWORD` (a Google app password, not the normal password), plus `NEXT_PUBLIC_SITE_URL` (the canonical HTTPS website URL). See [DEPLOYMENT.md](./DEPLOYMENT.md) for secure setup. Alternatively configure `MAIL_PROVIDER=resend`, `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for a verified sender. The selected provider receives the recipient address and one-time reset link. Until configured, requests report that delivery is unavailable. Gmail credential checks run for known and unknown addresses alike; authentication failures report a generic temporary-unavailability error. Send failures produce a sanitized server log, while responses avoid revealing account membership. Google sending limits and possible server sign-in blocks require real delivery tests. No live email delivery has yet been verified.
- Reset links expire after 30 minutes. Only a hash of the random token is stored in private CMS storage. Links carry the token in a URL fragment which the account screen removes immediately. Redemption consumes the account's reset generation atomically, changes the password, and revokes existing sessions and sibling reset links. Requests return the same message for unknown and eligible addresses. Include expired reset records, consumed reset generations, and rate-limit records in production retention cleanup.
- Supabase table permissions, server credentials, and hosting environment variables need live validation. The local HTTP suite and mocked Supabase adapter tests do not replace checking the deployed database. Verify that a publishable key cannot read or write `cms_records`, while the server key can create/read/delete a temporary test record.
- Review the dependency audit for the existing lockfile. This change does not silently upgrade framework or CMS dependencies.
- Inquiry protection includes validation, consent, honeypot and email-based throttles. Add a configured edge rate limiter/challenge service before high-volume public use.
- Schedule retention/cleanup for old rate-limit, audit and analytics records. Reports currently load stored events; production scale requires date-indexed queries/aggregation or a dedicated analytics adapter. This first-party collector is not yet high-volume analytics infrastructure.

## Remaining scope

This is a reviewable first implementation, not every item in the full brief. Remaining enhancements: email verification/newsletter delivery; geography/session engagement provider integration; advanced homepage layout builders; full category rename propagation; ownership reassignment UI; move-button/drag-and-drop ordering; logo/time-zone/date-format and pagination controls; richer advertiser asset libraries and revenue summaries; invoicing/payments; and production retention/abuse controls. Raw HTML/script ads are disabled. Sidebar placements need final template/design integration.

## Verification

Run `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:cms`, `node scripts/test-supabase-store.mjs`, and `node scripts/test-password-reset.mjs`. The HTTP suite starts a temporary development instance on port 3137 and stores test accounts/content under a fresh OS temporary directory. The Supabase test uses mocked requests, never real credentials. Tests do not write users or campaigns into repository content or production. Run builds separately from the HTTP suite.

Main, public hosting, and existing content are not changed until this branch is reviewed and deployed.
