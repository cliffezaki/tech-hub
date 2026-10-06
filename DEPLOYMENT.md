# Tech Hub staging and production setup

The website runs on Vercel, articles/pages/media stay in Sanity, and private accounts,
advertising records, subscriber preferences and reporting events live in Supabase.
Password-reset emails use Resend. The account upgrade replaces the old shared
`ADMIN_PASSWORD` login. See [CMS-SETUP.md](./CMS-SETUP.md) for remaining feature scope.

## 1. Prepare isolated staging storage

Keep the existing live Sanity content dataset. Create a second public dataset named
`staging` in the same Sanity project. Copy the existing public content to it if needed;
do not run demo seeding against production. The server-side Sanity write token must
have access to the staging dataset. Sanity's private datasets are not required.

Create a separate Supabase project on its Free plan, named for Tech Hub staging.
Run [supabase/cms-records.sql](./supabase/cms-records.sql) once in that new project's
SQL editor. The script creates the CMS table, enables row-level security and revokes
all access for anonymous and browser-authenticated clients. The website server uses
a secret API key. No table is made publicly readable.

Get the Supabase project's HTTPS URL and a secret key beginning with `sb_secret_`.
Use **Settings → API Keys** in Supabase. Credentials belong in hosting secrets,
never Git, screenshots or chat. Use separate staging and production projects.

## 2. Configure the Vercel preview branch

In the existing **tech-hub** Vercel project's Environment Variables, select only the
Preview branch `codex/publishing-cms-advertising`. Exclude Production and other
branches. Branch-specific overrides keep live settings intact.

| Variable | Preview value |
| --- | --- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Your existing Tech Hub Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | `staging` |
| `SANITY_API_WRITE_TOKEN` | Server-side Sanity token authorized for staging |
| `SUPABASE_URL` | HTTPS URL of the staging Supabase project |
| `SUPABASE_SECRET_KEY` | Staging secret API key beginning with `sb_secret_` |
| `ADMIN_SESSION_SECRET` | A new random secret of at least 32 characters |
| `OWNER_EMAIL` | Your chosen owner sign-in email |
| `OWNER_SETUP_TOKEN` | A different random secret of at least 32 characters |
| `NEXT_PUBLIC_SITE_URL` | The stable HTTPS URL for this preview branch |

Keep secret values server-only. Do not add `NEXT_PUBLIC_` to the Supabase secret,
Sanity write token, session secret or setup token. `CMS_PRIVATE_DATASET` and
`ADMIN_PASSWORD` are no longer used by this branch.

Redeploy the existing preview after setting the variables. Do not promote it to
production yet. A successful code build alone does not verify database access.

## 3. Create the owner account

Open the preview's `/account` page, select **Owner setup**, and enter the configured
owner email, your name, setup token and a password of 12–256 characters. Complete
password entry yourself. The website should open `/admin` afterward.

Remove the preview's `OWNER_SETUP_TOKEN` from Vercel after setup and redeploy the
preview. The owner account remains in Supabase. Public registration creates readers
and cannot claim the reserved owner email or choose a privileged role.

## 4. Enable password-reset delivery

Configure a Resend account and verified sender. Add preview-only `RESEND_API_KEY`
and `RESEND_FROM_EMAIL` in Vercel. `NEXT_PUBLIC_SITE_URL` must point to the HTTPS
preview, so email links return to that environment. Redeploy and request a reset
for your own account. Links expire after 30 minutes and work once. Resetting the
password invalidates older sessions and sibling reset links.

Do not use real mailing lists or customer advertising data for staging tests.

## 5. Verify before rollout

- Check that a Supabase publishable key cannot read or write `cms_records`, while
  the server key can access a temporary test record.
- Sign in as the owner and create a test author. Verify author drafts and owner
  publishing in the staging Sanity dataset.
- Create a sample advertising inquiry and campaign; verify they stay in staging
  Supabase and appear only when configured to run.
- Test the approved sender's password-reset email and confirm old sessions stop
  working after resetting a password.
- Check the public navigation on desktop and mobile.

## Production rollout

Keep the pull request as a draft until review and staging validation finish. Use
separate production Supabase storage and secrets, retain the live Sanity content
dataset, and set the canonical website URL for production emails. Publish the
actual privacy/terms pages, review outstanding dependency and feature work, and
then explicitly approve merging and production deployment.

[Supabase Free](https://supabase.com/pricing) includes a 500 MB database and a limit
of two active projects; inactive projects can pause after a week and automatic
backups are not included. Review backup and availability needs before using it
for a live business. Additional paid plans are optional, not enabled by this setup.

## Local development

Without Supabase variables, development stores private records in `.data/platform`.
With Supabase configured, development uses that project, so point it only at staging.
Invalid database configuration and deployed environments never fall back to local
private files. Sanity content follows its own dataset settings independently.
