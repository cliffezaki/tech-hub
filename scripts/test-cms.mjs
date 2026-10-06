import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { randomBytes, createHash } from "node:crypto"

const temporary = await mkdtemp(path.join(os.tmpdir(), "techhub-cms-test-"))
await mkdir(path.join(temporary, "content"))
const port = 3137
const base = `http://localhost:${port}`
const setupToken = randomBytes(32).toString("hex")
const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "-p", String(port)],
    {
        env: {
            ...process.env,
            WATCHPACK_POLLING: "true",
            ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
            OWNER_EMAIL: "owner@example.test",
            OWNER_SETUP_TOKEN: setupToken,
            CMS_TEST_DATA_DIR: path.join(temporary, "private"),
            CMS_TEST_CONTENT_DIR: path.join(temporary, "content"),
            NEXT_PUBLIC_SANITY_PROJECT_ID: "",
            SANITY_API_WRITE_TOKEN: "",
            CMS_PRIVATE_DATASET: "",
            SUPABASE_URL: "",
            SUPABASE_SECRET_KEY: "",
            RESEND_API_KEY: "",
            RESEND_FROM_EMAIL: "",
        },
        stdio: ["ignore", "pipe", "pipe"],
    }
)
let logs = ""
server.stdout.on("data", (d) => {
    logs = (logs + d).slice(-20000)
    if (process.env.CMS_TEST_VERBOSE) process.stdout.write(d)
})
server.stderr.on("data", (d) => {
    logs = (logs + d).slice(-20000)
    if (process.env.CMS_TEST_VERBOSE) process.stderr.write(d)
})
let checks = 0
async function call(
    url,
    { method = "GET", body, cookie = "", status = 200, origin = base } = {}
) {
    const response = await fetch(`${base}${url}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            ...(origin ? { Origin: origin } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        redirect: "manual",
    })
    const text = await response.text()
    assert.equal(
        response.status,
        status,
        `${method} ${url}: ${text.slice(0, 600)}`
    )
    checks++
    return {
        data: response.headers.get("content-type")?.includes("application/json")
            ? JSON.parse(text)
            : text,
        cookie: response.headers.get("set-cookie")?.split(";")[0] || cookie,
    }
}
try {
    let ready = false
    for (let i = 0; i < 150; i++) {
        try {
            const r = await fetch(`${base}/api/auth/me`)
            if (r.ok) {
                ready = true
                break
            }
        } catch {}
        await new Promise((r) => setTimeout(r, 1000))
    }
    assert(ready, "Development server did not become ready")
    const post = (url, body, cookie, status = 200) =>
        call(url, { method: "POST", body, cookie, status })
    await post(
        "/api/auth/setup",
        {
            email: "owner@example.test",
            password: "Test-password-long!",
            setupToken: "invalid",
        },
        "",
        403
    )
    await post(
        "/api/auth/register",
        { email: "owner@example.test", password: "Test-password-long!" },
        "",
        400
    )
    const owner = await post("/api/auth/setup", {
        email: "owner@example.test",
        password: "Test-password-long!",
        setupToken,
        name: "Test Owner",
    })
    assert.equal(owner.data.user.role, "owner")
    assert.equal(owner.data.redirect, "/admin")
    const reader = await post("/api/auth/register", {
        email: "reader@example.test",
        password: "Test-password-long!",
        role: "owner",
        subscribed: true,
    })
    assert.equal(reader.data.user.role, "reader")
    assert.equal(reader.data.redirect, "/account")
    await call("/api/cms/users", { cookie: reader.cookie, status: 403 })
    await post("/api/articles", { title: "Denied" }, reader.cookie, 403)
    await call("/api/cms/categories", {
        method: "POST",
        body: { name: "CSRF" },
        cookie: owner.cookie,
        origin: "https://attacker.example",
        status: 403,
    })
    await call("/api/cms/categories", {
        method: "POST",
        body: { name: "CSRF" },
        cookie: owner.cookie,
        origin: "",
        status: 403,
    })
    await post(
        "/api/cms/users",
        {
            email: "author@example.test",
            name: "Test Author",
            role: "author",
            password: "Test-password-long!",
            status: "active",
        },
        owner.cookie
    )
    const author = await post("/api/auth/login", {
        email: "author@example.test",
        password: "Test-password-long!",
    })
    const draft = await post(
        "/api/articles",
        {
            title: "Private author draft",
            status: "draft",
            content: "PRIVATE_TEST_MARKER",
            section: "news",
            author: "Forged owner",
        },
        author.cookie,
        201
    )
    assert.equal(draft.data.author, "Test Author")
    const publicArticles = await call("/api/articles")
    assert(!publicArticles.data.some((a) => a.id === draft.data.id))
    await call(`/api/articles/${draft.data.id}`, { status: 404 })
    await post(
        "/api/cms/users",
        {
            email: "other@example.test",
            name: "Other Author",
            role: "author",
            password: "Test-password-long!",
            status: "active",
        },
        owner.cookie
    )
    const other = await post("/api/auth/login", {
        email: "other@example.test",
        password: "Test-password-long!",
    })
    await call(`/api/articles/${draft.data.id}`, {
        cookie: other.cookie,
        status: 404,
    })
    await call(`/api/articles/${draft.data.id}`, {
        method: "PUT",
        body: { content: "Overwrite" },
        cookie: other.cookie,
        status: 403,
    })
    await call(`/api/articles/${draft.data.id}`, {
        method: "PUT",
        body: { status: "published" },
        cookie: author.cookie,
        status: 403,
    })
    await call(`/api/articles/${draft.data.id}`, {
        method: "PUT",
        body: {
            status: "published",
            pinnedAreas: ["homepage"],
            sponsorship: "Sponsored test disclosure",
        },
        cookie: owner.cookie,
    })
    const published = await call(`/api/articles/${draft.data.id}`)
    assert.equal(published.data.sponsorship, "Sponsored test disclosure")
    await call(`/api/articles/${draft.data.id}`, {
        method: "PUT",
        body: { content: "Publish bypass" },
        cookie: author.cookie,
        status: 403,
    })
    await post(
        "/api/cms/users",
        {
            email: "author@example.test",
            name: "Test Author",
            role: "author",
            status: "suspended",
        },
        owner.cookie
    )
    const suspended = await call("/api/auth/me", { cookie: author.cookie })
    assert.equal(suspended.data.user, null)
    await post(
        "/api/cms/users",
        { email: "owner@example.test", role: "reader" },
        owner.cookie,
        403
    )
    const pages = await call("/api/pages", { cookie: owner.cookie })
    assert(pages.data.some((p) => p.slug === "advertise"))
    assert.equal(pages.data.filter((p) => p.slug === "news").length, 1)
    await post("/api/pages", { title: "News", slug: "news" }, owner.cookie, 409)
    await call("/api/pages/builtin-news", {
        method: "PUT",
        body: {
            title: "Newsroom",
            content: "Custom introduction",
            status: "published",
        },
        cookie: owner.cookie,
    })
    const pagesAfter = await call("/api/pages", { cookie: owner.cookie })
    assert.equal(pagesAfter.data.filter((p) => p.slug === "news").length, 1)
    const advertiser = await post(
        "/api/cms/advertisers",
        { name: "Test advertiser", status: "active" },
        owner.cookie
    )
    const placement = await post(
        "/api/cms/placements",
        {
            name: "Test placement",
            slot: "homepage-top",
            enabled: true,
            exclusive: true,
        },
        owner.cookie
    )
    await post(
        "/api/cms/creatives",
        { name: "Unsafe creative", destination: "javascript:alert(1)" },
        owner.cookie,
        400
    )
    const creative = await post(
        "/api/cms/creatives",
        {
            name: "Test creative",
            text: "Test ad",
            destination: "https://example.com",
        },
        owner.cookie
    )
    const today = new Date().toISOString().slice(0, 10)
    const campaignInput = {
        name: "Test campaign",
        advertiserId: advertiser.data.id,
        placementId: placement.data.id,
        creativeId: creative.data.id,
        start: today,
        end: today,
        status: "active",
    }
    const campaign = await post(
        "/api/cms/campaigns",
        campaignInput,
        owner.cookie
    )
    await post("/api/cms/campaigns", campaignInput, owner.cookie, 409)
    const ads = await call("/api/public/ads?slot=homepage-top&path=/")
    assert.equal(ads.data.length, 1)
    await post(
        "/api/cms/campaigns",
        { ...campaignInput, id: campaign.data.id, status: "paused" },
        owner.cookie
    )
    const pausedAds = await call("/api/public/ads?slot=homepage-top&path=/")
    assert.equal(pausedAds.data.length, 0)
    await call("/api/cms/revenue", { cookie: reader.cookie, status: 403 })
    const inquiry = {
        name: "Test inquiry",
        email: "inquiry@example.test",
        message: "Campaign inquiry",
        consent: true,
        startedAt: Date.now() - 5000,
    }
    await post("/api/public/inquiries", { ...inquiry, consent: false }, "", 400)
    await post("/api/public/inquiries", inquiry)
    const inquiries = await call("/api/cms/inquiries", { cookie: owner.cookie })
    assert.equal(inquiries.data.length, 1)
    await call("/api/cms/inquiries", { cookie: reader.cookie, status: 403 })
    await post(
        "/api/cms/publishing",
        {
            name: "Test config",
            registration: true,
            analytics: true,
            comments: true,
        },
        owner.cookie
    )
    const event = {
        kind: "view",
        visitor: crypto.randomUUID(),
        eventId: crypto.randomUUID(),
        path: "/news/test",
        consent: false,
    }
    await post("/api/public/event", event)
    let report = await call(`/api/analytics?start=${today}&end=${today}`, {
        cookie: owner.cookie,
    })
    assert.equal(report.data.total, 0)
    await post("/api/public/event", { ...event, consent: true })
    await post("/api/public/event", { ...event, consent: true })
    report = await call(`/api/analytics?start=${today}&end=${today}`, {
        cookie: owner.cookie,
    })
    assert.equal(report.data.total, 1)
    assert.equal(report.data.visitors, 1)
    await post(
        "/api/public/comments",
        { articleId: draft.data.id, message: "Pending test comment" },
        reader.cookie
    )
    const publicComments = await call(
        `/api/public/comments?articleId=${draft.data.id}`
    )
    assert.equal(publicComments.data.length, 0)
    await post("/api/auth/forgot", { email: "reader@example.test" }, "", 503)
    const digest = (value) => createHash("sha256").update(value).digest("hex")
    const readerId = digest("reader@example.test")
    const accountFile = path.join(
        temporary,
        "private",
        `drafts.platform.users.${readerId}.json`
    )
    const account = JSON.parse(await readFile(accountFile, "utf8"))
    async function resetFixture(expiresAt, version = account.sessionVersion) {
        const token = randomBytes(32).toString("hex")
        await writeFile(
            path.join(
                temporary,
                "private",
                `drafts.platform.password-resets.${digest(token)}.json`
            ),
            JSON.stringify({
                userId: readerId,
                sessionVersion: version,
                expiresAt,
            })
        )
        return token
    }
    const resetPassword = "New-reset-password-long!"
    await post(
        "/api/auth/reset",
        { token: "invalid", password: resetPassword },
        "",
        400
    )
    await post(
        "/api/auth/reset",
        {
            token: await resetFixture(Date.now() - 1000),
            password: resetPassword,
        },
        "",
        400
    )
    await post(
        "/api/auth/reset",
        {
            token: await resetFixture(Date.now() + 60000, 0),
            password: resetPassword,
        },
        "",
        400
    )
    const token = await resetFixture(Date.now() + 60000)
    const sibling = await resetFixture(Date.now() + 60000)
    await post("/api/auth/reset", { token, password: "short" }, "", 400)
    await post("/api/auth/reset", { token, password: resetPassword }, "", 200)
    assert.equal(
        (await call("/api/auth/me", { cookie: reader.cookie })).data.user,
        null
    )
    await post("/api/auth/reset", { token, password: resetPassword }, "", 400)
    await post(
        "/api/auth/reset",
        { token: sibling, password: resetPassword },
        "",
        400
    )
    await post(
        "/api/auth/login",
        { email: account.email, password: "Test-password-long!" },
        "",
        401
    )
    await post("/api/auth/login", {
        email: account.email,
        password: resetPassword,
    })
    console.log(
        `PASS: ${checks} HTTP checks plus assertions for account roles, owner protection, draft privacy, authorization, CSRF, scheduling, consent, inquiry privacy, and moderation.`
    )
    console.log(`Isolated test data: ${temporary}`)
} catch (e) {
    console.error(logs)
    throw e
} finally {
    server.kill("SIGTERM")
}
