# Tech Hub

**CMS upgrade:** see [CMS-SETUP.md](./CMS-SETUP.md) for individual accounts, private Supabase storage, advertising, verification and remaining rollout work.

A technology news site built with Next.js — sections for News, Reviews, How To, How Stuff
Works, and Tech Kenya, with a built-in content dashboard for managing everything without
touching code.

## Run it locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. No configuration is needed: content is read from the JSON
files in `content/`. To use the dashboard, configure a session secret and owner setup
details as described in CMS-SETUP.md. Local private accounts are stored in `.data/platform`.

## The dashboard

<http://localhost:3000/admin>

| Screen | What it does |
| --- | --- |
| **Overview** | Counts, recent articles, quick links |
| **Articles** | Create, edit, delete, search, filter, and feature articles |
| **Pages** | Standalone pages such as About or Advertise, served at `/your-slug` |
| **Media** | Upload, copy, and delete images |
| **Homepage** | Choose the lead story and which articles are promoted |
| **Settings** | Site name, tagline, newsletter box, footer, social links |

Articles support a headline, slug, excerpt, Markdown body, category, section, author,
publish date, featured image with alt text and credit, read time, draft/published status,
and a featured flag. Drafts never appear on the public site.

## Going live

**See [DEPLOYMENT.md](./DEPLOYMENT.md)** for a step-by-step guide written for a first
deployment. The short version:

- Host on **Vercel**, which builds directly from the GitHub repository.
- Store content in **Sanity** (free tier). A deployed site cannot write to its own files,
  so the dashboard needs a database behind it to work in production.
- Store accounts and advertising records in **Supabase** (free tier), with the private
  table created by `supabase/cms-records.sql` and a server-only secret API key.
- Configure individual accounts and owner setup. `ADMIN_PASSWORD` is no longer used.

## How content storage works

One interface, two interchangeable drivers, chosen automatically:

| Condition | Driver | Used for |
| --- | --- | --- |
| Sanity credentials present | `lib/store/sanity-store.ts` | Production — content survives redeploys |
| No credentials | `lib/store/file-store.ts` | Local development — JSON files in `content/` |

Everything else in the app talks to `getStore()` in `lib/store/index.ts` and never knows
which driver is active. Uploaded images follow the same split: Sanity's CDN in production,
`public/uploads/` locally.

## Security

- `/admin` and every write API route require a signed session cookie, checked in `proxy.ts`
  and again inside each route handler.
- The dashboard requires an active individual account and server-checked permissions,
  including on localhost. Deployed accounts require Supabase and a session secret.
- The Sanity write token is server-side only and never reaches the browser.
- Supabase secret keys remain server-side. Anonymous and browser-authenticated users
  have no direct access to the private CMS table.

## Commands

```bash
npm run dev          # development server
npm run build        # production build
npm start            # run the production build
npm run lint         # eslint
npm run typecheck    # tsc --noEmit
npm run seed         # restore the demo content into content/ (local files)
npm run seed:sanity  # copy the demo content into your live Sanity database
```

## Project layout

```
app/
  (site)/          public pages — homepage, sections, articles, search, contact, CMS pages
  admin/           the dashboard (own layout, no public header or footer)
  api/             articles, pages, media, settings, auth, status
  studio/          optional Sanity Studio at /studio
components/        UI, article cards, markdown renderer, admin components
lib/
  store/           storage drivers and normalisation
  content.ts       read layer used by public pages
  auth.ts          individual signed sessions
  platform-store.ts private accounts/advertising storage
  supabase-store.ts server-only Supabase records
content/           local JSON content (development only)
scripts/           demo content and seeding
supabase/          private CMS table setup
```

## Notes on the demo content

The 23 starter articles exist so the site looks finished before real content is written.
Each has its own image and its own body copy, and all bylines are fictional staff names.
Delete them from the dashboard whenever you like — `npm run seed` puts them back.
