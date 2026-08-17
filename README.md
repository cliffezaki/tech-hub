# Tech Hub

Tech Hub is a Next.js technology/news site with section pages, article detail pages, a WordPress-style local dashboard for development, and Sanity Studio support for a durable deployed CMS.

## Run Locally

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Content Workflow

By default, the site reads content in this order:

1. Local CMS articles saved from `/admin`
2. Sanity articles, when Sanity is configured
3. Built-in mock content, so the site still works before setup

For production deployments, set this environment variable so the live site reads Sanity first:

```env
CONTENT_SOURCE=sanity
```

## Local CMS

Open:

```text
http://localhost:3000/admin
```

From there you can:

- Create articles
- Edit articles
- Delete articles
- Manage starter/demo posts that were seeded into `content/articles`
- Manage draft/static pages at `/admin/pages`
- View and copy image URLs from the media library at `/admin/media`
- Assign each article to News, Reviews, How To, How Stuff Works, or Tech Kenya
- Add an author, excerpt, read time, publish date, image URL, and article body

Local CMS articles are saved as JSON files under:

```text
content/articles
```

Local CMS pages are saved as JSON files under:

```text
content/pages
```

This is ideal for local editing and early development. For a deployed production CMS, use Sanity because serverless hosts do not persist runtime edits to local JSON files.

## Seed Demo Content

The current demo posts and starter pages can be reseeded with:

```bash
npm run seed
```

This keeps the site full during development while making the starter content editable through the local dashboard.

## Sanity CMS

Create a `.env.local` file with your Sanity project values:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your_real_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-12-27
```

Then start the dev server and open:

```text
http://localhost:3000/studio
```

The Sanity article schema supports title, slug, excerpt, author, main image, category, section, publish date, read time, and portable text body content.

The Sanity page schema supports title, slug, status, excerpt, images, and portable text body content.

For a live CMS-backed deployment, configure these environment variables on the host:

```env
CONTENT_SOURCE=sanity
NEXT_PUBLIC_SANITY_PROJECT_ID=your_real_project_id
NEXT_PUBLIC_SANITY_DATASET=production
NEXT_PUBLIC_SANITY_API_VERSION=2024-12-27
```

## Useful Commands

```bash
npm run dev
npm run seed
npm run lint
npm run build
npx tsc --noEmit
```
