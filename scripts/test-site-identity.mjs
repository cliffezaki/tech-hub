import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import { mkdtemp, mkdir, writeFile, readFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { randomBytes, createHash, scryptSync } from "node:crypto"
import sharp from "sharp"

const temp = await mkdtemp(path.join(os.tmpdir(), "techhub-identity-test-"))
await mkdir(path.join(temp, "content")); await mkdir(path.join(temp, "private"))
for (const role of ["owner", "author", "reader"]) {
    const email = `${role}@example.test`, id = createHash("sha256").update(email).digest("hex"), salt = randomBytes(16).toString("hex")
    await writeFile(path.join(temp, "private", `drafts.platform.users.${id}.json`), JSON.stringify({ id, email, name: role, role, status: "active", sessionVersion: 1, subscribed: false, createdAt: new Date().toISOString(), passwordHash: `${salt}:${scryptSync("Test-password-long!", salt, 64).toString("hex")}` }))
}
const base = "http://localhost:3142"
const server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "-p", "3142"], { env: { ...process.env, WATCHPACK_POLLING: "true", ADMIN_SESSION_SECRET: randomBytes(32).toString("hex"), CMS_TEST_DATA_DIR: path.join(temp, "private"), CMS_TEST_CONTENT_DIR: path.join(temp, "content"), NEXT_PUBLIC_SANITY_PROJECT_ID: "", SANITY_API_WRITE_TOKEN: "", CMS_PRIVATE_DATASET: "", SUPABASE_URL: "", SUPABASE_SECRET_KEY: "", NEXT_PUBLIC_SITE_URL: base, SMTP_USER: "", SMTP_PASSWORD: "", RESEND_API_KEY: "", MAIL_PROVIDER: "" }, stdio: ["ignore", "pipe", "pipe"] })
let logs = ""
for (const stream of [server.stdout, server.stderr]) stream.on("data", d => { logs = (logs + d).slice(-12000) })
async function call(url, body, cookie = "", status = 200, method = "POST") {
    const form = body instanceof FormData
    const response = await fetch(base + url, { method, headers: { Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...(!form && body ? { "Content-Type": "application/json" } : {}) }, body: body ? form ? body : JSON.stringify(body) : undefined, redirect: "manual" })
    const text = await response.text()
    assert.equal(response.status, status, `${url}: ${text.slice(0, 500)}`)
    return { data: response.headers.get("content-type")?.includes("json") ? JSON.parse(text) : text, cookie: response.headers.get("set-cookie")?.split(";")[0] || cookie, headers: response.headers }
}
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="600" height="200" viewBox="0 0 600 200"><rect width="600" height="200" fill="#C8202D"/><path d="M20 20h100v100H20z" fill="#fff"/></svg>'
function upload(source = svg, name = "brand.svg", kind = "logo") { const form = new FormData(); form.set("file", new Blob([source]), name); form.set("kind", kind); return form }
try {
    let ready = false
    for (let i = 0; i < 120; i++) { try { if ((await fetch(base + "/api/auth/me")).ok) { ready = true; break } } catch {} await new Promise(r => setTimeout(r, 1000)) }
    assert(ready, "Test server did not start")
    const cookies = {}
    for (const role of ["owner", "author", "reader"]) cookies[role] = (await call("/api/auth/login", { email: `${role}@example.test`, password: "Test-password-long!" })).cookie
    for (const cookie of ["", cookies.author, cookies.reader]) {
        await call("/api/settings/identity-image", upload(), cookie, 403)
        await call("/api/settings", { siteName: "Forbidden" }, cookie, 403, "PUT")
    }
    for (const unsafe of [svg.replace("<rect", '<script>alert(1)</script><rect'), svg.replace("<rect", '<image href="file:///etc/passwd"/><rect'), svg.replace("<rect", '<foreignObject/><rect'), svg.replace('fill="#fff"', 'fill="url(https://example.com/a)"'), '<!DOCTYPE svg [<!ENTITY test SYSTEM "file:///etc/passwd">]>' + svg, svg.replace("<rect", '<g onclick="alert(1)"></g><rect')]) await call("/api/settings/identity-image", upload(unsafe), cookies.owner, 400)
    await call("/api/settings/identity-image", upload("not an image", "fake.png"), cookies.owner, 400)
    const logo = (await call("/api/settings/identity-image", upload(), cookies.owner)).data
    const raw = await readFile(path.join(temp, "content", "uploads", path.basename(logo.url)))
    assert.equal((await sharp(raw).metadata()).format, "png")
    const icons = (await call("/api/settings/identity-image", upload(svg, "brand.svg", "icon"), cookies.owner)).data.icons
    for (const size of [16, 32, 180, 192, 512]) { const info = await sharp(await readFile(path.join(temp, "content", "uploads", path.basename(icons[`icon${size}`])))).metadata(); assert.equal(info.width, size); assert.equal(info.height, size) }
    const ico = await readFile(path.join(temp, "content", "uploads", path.basename(icons.iconIco)))
    assert.equal(ico.readUInt16LE(2), 1); assert.equal(ico.readUInt16LE(4), 2)
    await call("/api/settings", { logoLight: "https://evil.example/logo.svg" }, cookies.owner, 400, "PUT")
    await call("/api/settings", { siteName: "" }, cookies.owner, 400, "PUT")
    await call("/api/settings", { icon16: icons.icon16 }, cookies.owner, 400, "PUT")
    const saved = (await call("/api/settings", { siteName: "Identity Test", tagline: "Test publication", logoLight: logo.url, logoSame: "true", logoWidth: "160", ...icons, socialImage: logo.url, socialTitle: "Social title", socialDescription: "Social description" }, cookies.owner, 200, "PUT")).data
    assert(saved.identityVersion)
    const read = (await call("/api/settings", null, "", 200, "GET")).data
    assert.equal(read.logoLight, logo.url); assert.equal(read.iconIco, icons.iconIco)
    const html = (await call("/", null, "", 200, "GET")).data
    assert(html.includes(logo.url)); assert(html.includes("Social title")); assert(html.includes("apple-touch-icon")); assert(html.includes(icons.icon32))
    const manifest = (await call("/manifest.webmanifest", null, "", 200, "GET")).data
    assert.equal(manifest.name, "Identity Test"); assert(manifest.icons[0].src.includes(icons.icon192))
    const iconRedirect = await call("/favicon.ico", null, "", 307, "GET")
    assert.equal(iconRedirect.headers.get("location"), base + icons.iconIco)
    const media = (await call("/api/media", null, "", 200, "GET")).data
    const asset = media.find(a => a.url === logo.url)
    await call(`/api/media?id=${encodeURIComponent(asset.id)}`, null, cookies.owner, 409, "DELETE")
    const library = new FormData(); library.set("assetId", asset.id); library.set("kind", "social"); library.set("crop", "true"); library.set("zoom", "2"); library.set("x", "70"); library.set("y", "20")
    const cropped = (await call("/api/settings/identity-image", library, cookies.owner)).data
    assert.equal((await sharp(await readFile(path.join(temp, "content", "uploads", path.basename(cropped.url)))).metadata()).width, 1200)
    const cleared = (await call("/api/settings", { logoLight: "", ...Object.fromEntries(Object.keys(icons).map(k => [k, ""])) }, cookies.owner, 200, "PUT")).data
    assert.equal(cleared.logoLight, ""); assert.equal(cleared.iconIco, ""); assert.notEqual(cleared.identityVersion, saved.identityVersion)
    const persisted = JSON.parse(await readFile(path.join(temp, "content", "settings.json"), "utf8"))
    assert.equal(persisted.siteName, "Identity Test"); assert.equal(persisted.logoLight, "")
    console.log("PASS: role restrictions, unsafe SVG rejection, image decoding, uploads/library/crop, complete ICO and PNG sizes, persistent settings, live logo/metadata/manifest, cache versioning, media deletion protection, and removal fallback.")
} catch (error) { console.error(logs); throw error } finally { server.kill("SIGTERM") }
