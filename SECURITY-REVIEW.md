# Follow-up to the supplied security review

Checked against the current publishing branch, rather than the earlier shared-password CMS.

- **Draft API reads:** Already filtered by publication state and editorial permissions, including scheduled articles. Added explicit `private, no-store` and `Vary: Cookie` headers to article/page reads, including unpublished-item 404s, so private responses cannot be reused as public cache entries.
- **Login protection:** Already uses separate user accounts, salted scrypt password hashes, role checks, session versions and a required independent `ADMIN_SESSION_SECRET` of at least 32 characters. The persistent atomic-claim throttle allows eight attempts per email/action per 15-minute window. Added a Retry-After header to rejected attempts. No shared-password fallback exists.
- **Contact form:** Replaced the mailto handoff with a validated, same-origin POST through the existing email provider. Recipient comes from Settings → Contact email; the visitor is Reply-To, never the sender or recipient. Responses report success only after provider acceptance. Failures retain the form contents. Bounded request size, a honeypot, per-email limits and a publication-wide sending limit restrict abuse. SMTP acceptance does not prove final inbox placement.
- **Structured data:** Already escapes `<` before embedding JSON-LD. Regression coverage exercises a closing-script payload through the actual serializer expression.
- **Local paths:** Article/page reads and deletes already reject IDs outside an alphanumeric/hyphen/underscore allowlist; updates use those guarded reads. Regression coverage checks reads, updates and deletes against traversal inputs.
- **Server error responses:** Shared `handleError` now returns only its static public fallback. Exception details remain in server logs.
- **IDs:** New content/media IDs use cryptographic UUIDs. Existing IDs and URLs are preserved.

Validation includes isolated HTTP checks for role restrictions, draft visibility, scheduling, login throttling and cache behavior, plus contact success/failure, injection, request-size and provider tests. Contact and reset delivery tests mock the providers and send no real email. These checks cover the supplied findings, not a complete audit of all dependencies and integrations.
