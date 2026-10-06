import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { randomBytes, createHash, scryptSync } from "node:crypto"

const temporary = await mkdtemp(path.join(os.tmpdir(), "techhub-cms-test-"))
await mkdir(path.join(temporary, "content"))
const port = 3137
const base = `http://localhost:${port}`
const ownerId = createHash("sha256").update("owner@example.test").digest("hex")
const ownerSalt = randomBytes(16).toString("hex")
await mkdir(path.join(temporary, "private"), { recursive: true })
await writeFile(
    path.join(temporary, "private", `drafts.platform.users.${ownerId}.json`),
    JSON.stringify({
        id: ownerId, email: "owner@example.test", name: "Test Owner",
        role: "owner", status: "active", sessionVersion: 1,
        subscribed: false, createdAt: new Date().toISOString(),
        passwordHash: `${ownerSalt}:${scryptSync("Test-password-long!", ownerSalt, 64).toString("hex")}`,
    })
)
const server = spawn(
    process.execPath,
    ["node_modules/next/dist/bin/next", "dev", "-p", String(port)],
    {
        env: {
            ...process.env,
            WATCHPACK_POLLING: "true",
            ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"),
            OWNER_EMAIL: "reader@example.test",
            OWNER_SETUP_TOKEN: "retired-test-token-not-a-public-bootstrap",
            CMS_TEST_DATA_DIR: path.join(temporary, "private"),
            CMS_TEST_CONTENT_DIR: path.join(temporary, "content"),
            NEXT_PUBLIC_SANITY_PROJECT_ID: "",
            SANITY_API_WRITE_TOKEN: "",
            CMS_PRIVATE_DATASET: "",
            SUPABASE_URL: "",
            SUPABASE_SECRET_KEY: "",
            RESEND_API_KEY: "",
            RESEND_FROM_EMAIL: "",
            MAIL_PROVIDER: "",
            SMTP_USER: "",
            SMTP_PASSWORD: "",
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
        404
    )
    await post(
        "/api/auth/register",
        { email: "owner@example.test", password: "Test-password-long!" },
        "",
        400
    )
    const owner = await post("/api/auth/login", {
        email: " OWNER@EXAMPLE.TEST ",
        password: "Test-password-long!",
    })
    assert.equal(owner.data.user.role, "owner")
    assert.equal(owner.data.redirect, "/admin")
    const accountScreen = await call("/account")
    assert(!/Owner setup|Owner Setup|Set up owner account|setupToken/.test(accountScreen.data))
    await post("/api/auth/setup", {
        email: "new-owner@example.test", password: "Test-password-long!",
        setupToken: "retired-test-token-not-a-public-bootstrap",
    }, "", 404)
    await post("/api/auth/login", { email: "owner@example.test", password: "incorrect" }, "", 401)
    await post("/api/auth/login", { email: "missing@example.test", password: "Test-password-long!" }, "", 401)
    const ownerInfo = await call("/api/auth/me", { cookie: owner.cookie })
    assert(ownerInfo.data.permissions.includes("users.manage"))
    assert(ownerInfo.data.permissions.includes("articles.publish"))
    assert(ownerInfo.data.permissions.includes("ads.settings"))
    await call("/api/cms/demo", { status: 403 })
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
    await post("/api/cms/demo", { index: 0 }, reader.cookie, 403)
    await call("/api/cms/demo", {
        method: "POST", body: { index: 0 }, cookie: owner.cookie,
        origin: "https://attacker.example", status: 403,
    })
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
    await post("/api/auth/login", {
        email: "author@example.test", password: "Test-password-long!",
    }, "", 401)
    for (const role of ["administrator", "editor", "contributor"]) {
        const email = `${role}@example.test`
        await post("/api/cms/users", {
            email, name: `Test ${role}`, role, status: "active",
            password: "Test-password-long!",
        }, owner.cookie)
        const login = await post("/api/auth/login", { email, password: "Test-password-long!" })
        assert.equal(login.data.user.role, role)
        assert.equal(login.data.redirect, "/admin")
        assert(!Object.hasOwn(login.data.user, "passwordHash"))
        await post("/api/cms/demo", { index: 0 }, login.cookie, 403)
        await call("/api/cms/users", { cookie: login.cookie, status: 403 })
        await post("/api/cms/users", {
            email: "privileged@example.test", role: "administrator", password: "Test-password-long!",
        }, login.cookie, 403)
        await post("/api/cms/roles", { reader: ["users.manage"] }, login.cookie, 403)
        const draftByRole = await post("/api/articles", {
            title: `${role} private draft`, section: "news", status: "draft", content: "Draft content",
        }, login.cookie, 201)
        if (role === "contributor") {
            await call(`/api/articles/${draftByRole.data.id}`, {
                method: "PUT", body: { title: "Contributor updated draft" }, cookie: login.cookie,
            })
            await call(`/api/articles/${draftByRole.data.id}`, {
                method: "PUT", body: { status: "published" }, cookie: login.cookie, status: 403,
            })
            await call("/api/media", { method: "POST", cookie: login.cookie, body: {}, status: 403 })
            await post("/api/cms/users", {
                email, name: "Test Contributor", role, status: "active",
                permissions: ["media.manage"], deniedPermissions: ["articles.create"],
            }, owner.cookie)
            assert.equal((await call("/api/auth/me", { cookie: login.cookie })).data.user, null)
            const restrictedLogin = await post("/api/auth/login", { email, password: "Test-password-long!" })
            const restrictedInfo = await call("/api/auth/me", { cookie: restrictedLogin.cookie })
            assert(restrictedInfo.data.permissions.includes("media.manage"))
            assert(!restrictedInfo.data.permissions.includes("articles.create"))
            await post("/api/articles", { title: "Blocked by owner override" }, restrictedLogin.cookie, 403)
        } else {
            await call(`/api/articles/${draftByRole.data.id}`, {
                method: "PUT", body: { status: "published" }, cookie: login.cookie,
            })
            await call(`/api/articles/${draftByRole.data.id}`, {
                method: "PUT", body: { status: "draft" }, cookie: login.cookie,
            })
            await call(`/api/articles/${draftByRole.data.id}`, { status: 404 })
        }
    }
    const rolesSaved = await post("/api/cms/roles", { owner: [], reader: [] }, owner.cookie)
    assert(rolesSaved.data.owner.includes("users.manage"))
    assert((await call("/api/auth/me", { cookie: owner.cookie })).data.permissions.includes("settings.manage"))
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
    const demoPlan = await call("/api/cms/demo", { cookie: owner.cookie })
    assert.equal(demoPlan.data.enabled, true)
    assert.equal(demoPlan.data.count, 17)
    assert.deepEqual(demoPlan.data.sections, {
        news: 5, reviews: 3, "how-to": 3, "how-stuff-works": 3, "tech-kenya": 3,
    })
    await post("/api/cms/demo", { index: -1 }, owner.cookie, 400)
    await post("/api/cms/demo", { index: "0" }, owner.cookie, 400)
    await post("/api/cms/demo", { index: 17 }, owner.cookie, 400)
    const seeded = []
    for (let index = 0; index < 17; index++) {
        const sample = await post("/api/cms/demo", { index }, owner.cookie, 201)
        assert.equal(sample.data.article.demo, true)
        assert.equal(sample.data.article.ownerId, ownerId)
        assert(sample.data.article.imageUrl.startsWith("/uploads/"))
        assert(!sample.data.article.content.includes("{{diagram}}"))
        assert(sample.data.article.content.includes("https://"))
        seeded.push(sample.data.article)
    }
    await call(`/api/articles/${seeded[0].id}`, {
        method: "PUT", body: { title: "Owner edited sample", featured: false }, cookie: owner.cookie,
    })
    const repeated = await post("/api/cms/demo", { index: 0 }, owner.cookie)
    assert.equal(repeated.data.skipped, true)
    assert.equal(repeated.data.article.title, "Owner edited sample")
    assert.equal(repeated.data.article.imageUrl, seeded[0].imageUrl)
    const media = await call("/api/media")
    assert.equal(media.data.length, 21)
    const image = media.data.find(m => m.url === seeded[0].imageUrl)
    await call(`/api/media?id=${encodeURIComponent(image.id)}`, {
        method: "DELETE", cookie: owner.cookie, status: 409,
    })
    // Exercise the normal image-upload path without enabling unsafe SVG uploads.
    const form = new FormData()
    form.set("file", new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9kAAAAASUVORK5CYII=", "base64")], { type: "image/png" }), "isolated-test.png")
    const upload = await fetch(`${base}/api/media`, { method: "POST", headers: { Origin: base, Cookie: owner.cookie }, body: form })
    assert.equal(upload.status, 201)
    checks++
    const uploaded = await upload.json()
    await call(`/api/media?id=${encodeURIComponent(uploaded.id)}`, { method: "DELETE", cookie: owner.cookie })
    const svgForm = new FormData()
    svgForm.set("file", new Blob(["<svg/>"], { type: "image/svg+xml" }), "blocked.svg")
    const blockedSvg = await fetch(`${base}/api/media`, { method: "POST", headers: { Origin: base, Cookie: owner.cookie }, body: svgForm })
    assert.equal(blockedSvg.status, 400)
    checks++
    const home = await call("/")
    assert(home.data.includes("Owner edited sample"))
    const storyPage = await call(`/how-stuff-works/${seeded[11].slug}`)
    assert(storyPage.data.includes("Editorial sample"))
    assert(storyPage.data.includes("Simplified sequence"))
    const bylinePage = await call("/authors/tech-hub-demo-desk")
    assert(bylinePage.data.includes("Page <!-- -->1<!-- --> of <!-- -->3") || bylinePage.data.includes("Article pagination"))
    assert(!bylinePage.data.includes("PRIVATE_TEST_MARKER"))
    await call("/authors/nonexistent-author", { status: 404 })
    await call(`/api/articles/${seeded[1].id}`, {
        method: "PUT", body: { status: "draft" }, cookie: owner.cookie,
    })
    await call(`/news/${seeded[1].slug}`, { status: 404 })
    await call(`/api/articles/${seeded[1].id}`, {
        method: "PUT", body: { status: "published" }, cookie: owner.cookie,
    })
    await call(`/news/${seeded[1].slug}`)
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
