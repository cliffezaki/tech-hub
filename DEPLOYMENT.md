# Taking Tech Hub live

This guide assumes you have never deployed a website before. Follow it top to bottom and
you will end up with a live site whose dashboard works from any browser.

Budget about 45 minutes. Everything used here has a free tier.

---

## How the pieces fit together

Three separate things make up the live site:

| Piece | What it does | Where it lives |
| --- | --- | --- |
| **The website** | The pages readers see, and the `/admin` dashboard | Vercel |
| **The CMS database** | Stores your articles, pages, images, settings | Sanity |
| **The code** | The source, which Vercel rebuilds from | GitHub |

The important idea: **a deployed website cannot save files to itself.** Hosting platforms
give your site a read-only copy of the code. That is why articles written on the live site
must go into a database (Sanity) rather than into files on disk.

Locally, none of this applies — the site falls back to JSON files in `content/`, so
`npm run dev` works with no setup at all.

---

## Step 1 — Create the CMS database (Sanity)

1. Go to **[sanity.io/manage](https://www.sanity.io/manage)** and sign up (GitHub login is fine).
2. Click **Create new project**.
   - Name it `Tech Hub`
   - Dataset: **production**
   - Plan: **Free**
3. When it opens, copy the **Project ID** from the project page. It looks like `a1b2c3d4`.
   Keep it somewhere handy.
4. In the left sidebar go to **API → Tokens → Add API token**.
   - Name: `Website write access`
   - Permissions: **Editor**
   - Click Save and **copy the token immediately** — it is only shown once.

You now have two values: a **Project ID** and a **Token**.

### Tell Sanity your site is allowed to talk to it

Still in **API**, find **CORS origins → Add CORS origin**:

- Origin: `http://localhost:3000`
- Tick **Allow credentials**
- Save

You will add your real site address here too, after Step 3.

---

## Step 2 — Put the code on GitHub

If the code is already on GitHub, skip to Step 3.

```bash
git add .
git commit -m "Tech Hub site"
git push
```

---

## Step 3 — Deploy the website (Vercel)

1. Go to **[vercel.com](https://vercel.com)** and sign up with your GitHub account.
2. Click **Add New → Project**, find your repository, click **Import**.
3. Vercel detects Next.js automatically. **Do not click Deploy yet.**
4. Expand **Environment Variables** and add these five, one at a time:

   | Name | Value |
   | --- | --- |
   | `ADMIN_PASSWORD` | A long password you choose. This is what you type to open the dashboard. |
   | `ADMIN_SESSION_SECRET` | Any other long random string. |
   | `NEXT_PUBLIC_SANITY_PROJECT_ID` | The Project ID from Step 1. |
   | `NEXT_PUBLIC_SANITY_DATASET` | `production` |
   | `SANITY_API_WRITE_TOKEN` | The token from Step 1. |

5. Click **Deploy** and wait a couple of minutes.

Vercel gives you an address such as `my-tech-website.vercel.app`. Open it — the site is
live, but empty, because your Sanity database has no articles in it yet.

### Add your site to Sanity's CORS list

Go back to Sanity → **API → CORS origins → Add CORS origin**, and add your Vercel address
(for example `https://my-tech-website.vercel.app`) with **Allow credentials** ticked.

---

## Step 4 — Fill the live site with the starter content

This copies the 23 demo articles, the About and Advertise pages, and the site settings
into your Sanity database, so the live site is not empty while you write real articles.

Run this on your own computer, in the project folder, replacing the two values:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id SANITY_API_WRITE_TOKEN=your-token npm run seed:sanity
```

On Windows PowerShell, set them first instead:

```bash
$env:NEXT_PUBLIC_SANITY_PROJECT_ID="your-project-id"; $env:SANITY_API_WRITE_TOKEN="your-token"; npm run seed:sanity
```

Refresh your live site — the articles are there.

You can delete every demo article from the dashboard once you have your own. Re-running
this command restores them.

---

## Step 5 — Log in to the live dashboard

Go to `https://your-site.vercel.app/admin`.

You will be asked for the password — the `ADMIN_PASSWORD` you set in Step 3. After that you
can create, edit, delete, and feature articles, upload images, edit pages, and change site
settings, all from the live site. Changes appear on the public pages immediately.

**If the dashboard shows an amber warning bar**, it is telling you which environment
variable is missing. The two that matter are `NEXT_PUBLIC_SANITY_PROJECT_ID` and
`SANITY_API_WRITE_TOKEN`. Add them in Vercel → Settings → Environment Variables, then
redeploy (Deployments → ⋯ → Redeploy).

---

## Step 6 — Use your own domain (optional)

1. Buy a domain from any registrar (Namecheap, Google Domains, Truehost, etc.).
2. In Vercel: **Settings → Domains → Add**, type your domain.
3. Vercel shows the DNS records to create. In your registrar's DNS settings, add them:
   - Usually an `A` record for the root domain pointing at Vercel's IP
   - And a `CNAME` for `www` pointing at `cname.vercel-dns.com`
4. Wait for it to verify (minutes to a few hours).
5. Add one more environment variable in Vercel so links and share cards use the right address:

   | Name | Value |
   | --- | --- |
   | `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |

6. Add the domain to Sanity's CORS origins list as well.
7. Redeploy.

---

## Working locally after deployment

Copy `.env.example` to `.env.local` and fill in the same values you used on Vercel. Then:

```bash
npm run dev
```

With Sanity credentials present, your local site edits **the same live database** — useful,
but remember that deleting an article locally deletes it from the live site too.

Leave the Sanity values out of `.env.local` and the site falls back to the JSON files in
`content/`, which is a completely safe sandbox.

---

## Where things live, in one table

| Thing | Local development | Live site |
| --- | --- | --- |
| Articles and pages | JSON files in `content/` | Sanity database |
| Uploaded images | `public/uploads/` | Sanity CDN |
| Site settings | `content/settings.json` | Sanity database |
| Dashboard password | `.env.local` | Vercel environment variables |

---

## Common problems

**"Saving is disabled in this environment" in the dashboard**
Sanity credentials are missing or the token lacks Editor permission. Check
`NEXT_PUBLIC_SANITY_PROJECT_ID` and `SANITY_API_WRITE_TOKEN` in Vercel, then redeploy.

**The dashboard asks for a password I never set**
`ADMIN_PASSWORD` is what it wants. If you did not set one, the dashboard stays locked on
purpose so strangers cannot edit your site. Add it in Vercel and redeploy.

**An article I published is not on the site**
Check its status is *Published* rather than *Draft* in the dashboard.

**Images do not appear after uploading**
Uploads go to Sanity. If the upload button errors, the write token is missing or read-only.

**Changes to environment variables did nothing**
Vercel only picks them up on a new deployment. Go to Deployments → ⋯ → Redeploy.

**I want to start over with clean content**
Delete the demo articles from the dashboard, or re-run the Step 4 command to restore them.
