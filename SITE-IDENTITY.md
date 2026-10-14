# Site Identity

Open **Settings → Site Identity**. Only users with `settings.manage` can upload branding images or save changes; the page uses the existing settings permission guard.

1. Upload an image or select it from Media library.
2. Optionally crop, position and zoom it. Select **Use this image** to prepare the safe, optimized copy.
3. Check the light/dark, browser-tab and social-card previews.
4. Select **Save Changes**. Preparing an image does not replace live branding by itself.

The original text logo is retained until a replacement is explicitly saved. Removing a logo restores the text fallback. A missing dark logo uses the primary logo. Removing a site icon restores the neutral Tech Hub TH icon, not the starter-framework icon.

Suggested sources: logo 600 × 200 px, icon 512 × 512 px, social card 1200 × 630 px. Files are limited to 4 MB and 25 million decoded pixels. Static PNG, JPEG, WebP and SVG are supported. SVG is parsed using a strict allowlist, rejects scripts, embedded images, styles, entities and external resources, then is rasterized to PNG; unrestricted vector documents are intentionally not retained. Convert unsupported SVG exports to PNG before uploading.

Prepared media is stored using the current CMS driver (Sanity in production). Settings live in the existing `siteSettings` document. No browser storage, hardcoded uploaded URLs or deployment filesystem is used in production. Unused prepared files remain in the media library; they can be deleted there. Media deletion is blocked for assets referenced by Site Identity.

Icon generation produces PNGs at 16, 32, 180, 192 and 512 px plus a two-size ICO. Metadata links include a save-version query parameter; the manifest is dynamic and `/favicon.ico` uses a noncached redirect to the current ICO. The old bundled favicon must not be restored to `app/favicon.ico`, because Next.js file metadata takes priority over configured icons. Browser bookmark/home-screen caches and social networks can retain older images; refresh/re-add a bookmark or request a social-platform re-scrape when necessary.

Public pages read saved identity at request time and settings saves invalidate the site layout. Open tabs may require refresh. Article-specific social metadata still takes precedence over site defaults. Publication language, robots, account settings, and other integrations are not altered.

Validation: `node scripts/test-site-identity.mjs` runs isolated local storage tests for owner/author/reader permissions, SVG rejection, uploads, library selection, cropping, generated sizes/ICO, saving/reloading, public metadata/manifest, reference protection and removal. It never uses production CMS or email credentials.
