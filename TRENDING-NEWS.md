# Trending news

Replaces only the homepage's first secondary ArticleCard. `secondary.slice(1)` retains the lower recommendations and their existing ArticleCard rendering. Individual article pages are unchanged.

## Infrastructure and activation

- Existing Next.js and Netlify deployment; no new npm dependencies.
- Existing private Supabase `cms_records` table, under the new `trending` collection. No migration, public database access or RLS changes are needed.
- Uses Netlify AI Gateway through the official OpenAI SDK and runtime-injected provider credentials. The default model is gpt-4.1-mini, confirmed in the live provider catalogue. No separate API key is needed on an eligible Netlify plan with AI Features enabled. Usage consumes existing Netlify credits; no plan change or recharge is configured. TRENDING_AI_MODEL can override the model; a project OPENAI_API_KEY overrides gateway injection.
- Existing SUPABASE_URL, SUPABASE_SECRET_KEY and ADMIN_SESSION_SECRET must include Functions scope. The schedule uses a purpose-specific, short-lived HMAC derived from the existing session secret; it never transmits that secret.
- The scheduler checks every five minutes, including initial population. The database rate limit allows generation no more than once every 110 minutes. Netlify schedules run only on the published deploy, not preview branches. No ChatGPT reminder or visitor-triggered generation is involved.
- Until the first verified batch is available, visitors see an honest unavailable state, never fabricated placeholder news.

## Processing and costs

Four fixed publisher feeds (BBC Technology, The Verge, TechCrunch and Ars Technica) are fetched concurrently with size/time limits and no redirects. Only HTTPS article URLs on those publishers' allowlisted domains are retained. XML entities/DTDs are rejected. Excerpts older than 36 hours, undated items, thin evidence, deals and off-topic items are skipped. At most 48 excerpts, each bounded to 1,800 characters, reach the model. No full article scraping or paywall bypass.

The editor groups coverage of the same event, prioritizes significant developments and targets seven original summaries, and at least four whenever enough evidence is available. Two publishers are preferred. One allowlisted publisher is accepted only with at least 90 words of supporting evidence and explicit attribution in the summary. A separate verification pass must approve every statement against supplied excerpts. Length, source identity, numeric grounding, repeated sources, headline overlap and copied 12-word runs are checked locally. This reduces risk; automated checks cannot guarantee perfect accuracy or legal clearance. Review publishers' feed reuse terms before commercial activation.

At most two AI requests per attempt (6,000 completion tokens each), with a 110-minute minimum between attempts and a database lease against overlapping runs. An unchanged source fingerprint skips generation. At most 12 scheduled attempts daily, usually fewer AI calls. Provider token costs depend on the chosen model; set a provider budget before activation. No paid news API subscription is required by this implementation.

Verified batches merge into a rolling feed of up to seven items. Matching source URLs, story IDs and similar headlines update the existing item; new stories replace the oldest at capacity. Source publication dates determine newest-first order. Four compact rows fit the fixed-height card, with remaining rows available by vertical scrolling. A minimum of four is a target, never permission to invent or retain expired stories. The snapshot is atomically replaced only after a nonempty verified batch. Failures retain recent output; stories expire based on original source publication dates, at 48 hours, not renewed by polling. Summaries are stored in Supabase and browsers poll every five minutes; reads never regenerate news. After six hours without a new batch, the feed says updates are delayed. No public endpoint accepts generation requests or user-supplied source URLs.

## Operations

Netlify function logs report configuration absence, refresh outcome or failure without source content or credentials. The private `trending/attempt` record stores the latest run status; `feed`, `processed` and `lock` hold bounded state. Repeated failures do not overwrite the last good feed. Investigate feed outages, provider limits or storage configuration, then use Run now after the minimum attempt interval. Removing OPENAI_API_KEY disables generation without deleting content.

## Validation

Run `node scripts/test-trending.mjs`, `npm run typecheck` and `npm run build`. Browser checks: narrow/wide layouts, both themes, no image/date output, source links, Escape/backdrop/close button, focus returning to the clicked headline, background scroll restored, loading/empty/delayed states. Live generation uses runtime-injected gateway credentials; mocks do not establish live factual accuracy or provider compatibility.
