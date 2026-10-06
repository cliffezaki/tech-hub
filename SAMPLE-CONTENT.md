# Researched staging samples

The Owner can use **Articles → Add researched samples to staging** on the Vercel branch preview.
This imports 17 articles: 5 News and 3 each in Reviews, How To, How Stuff Works and Tech Kenya.
There are 17 original SVG covers and 4 original supporting diagrams, uploaded to the configured
Sanity media system. The general upload endpoint still rejects untrusted SVG files.

All samples carry demo=true and batch techhub-researched-2026-10-06.
Use **Show demo articles only** in Articles to locate, edit, unpublish or delete them.
Cards and article pages disclose their sample status. Reviews explicitly describe their
documentation-based method: no invented hands-on tests, benchmark results or journalists.
Article source links point to primary organisations. Research date: 6 October 2026;
publication dates are the actual import times, with event dates stated in the copy.

The importer is Owner-only, same-origin protected and restricted to the Sanity staging
dataset in Vercel Preview. It is disabled in production. Local use requires an isolated
CMS_TEST_CONTENT_DIR in development; it never seeds the ordinary local content directory.
Each request imports one fixed server-owned article. Deterministic IDs and create-if-absent
mutations allow safe retries without overwriting edits. Existing slug collisions stop import.
Already created media can be reused after a partial failure. There is no automatic deletion.

Public author archives expose only published bylines, not private user records or email addresses.
Search and archives have six-item pagination and category filtering; public section pages retain
their lead-story layout. Draft and public reads are separate.

Sanity article/page drafts use its protected drafts. document path, not merely a status label.
Publishing/unpublishing transfers the document atomically and keeps the CMS article ID stable.
Do not deploy this change over legacy unprefixed drafts without reviewing/migrating those documents.
Media assets are public: do not upload confidential files, passwords or personal account records.
The dashboard prevents removal of media still referenced by an article/page.

Checks:

- scripts/test-cms.mjs: isolated HTTP account/RBAC, CSRF, article CRUD, 17 imports,
  retry preservation, normal PNG uploads, SVG rejection, media-use protection and public display.
- scripts/test-demo-store.mjs: actual Sanity adapter with mocked transport; protected draft
  paths, atomic status transitions, slug normalization and preservation of image fields.
- Existing reset-email and private Supabase adapter tests remain applicable.
- Owner confirmed receiving the Gmail reset message and logging in with the new password.

Preview import and live-content verification are separate from production promotion.
Do not merge/promote the preview or copy its environment secrets without the Owner's approval.
