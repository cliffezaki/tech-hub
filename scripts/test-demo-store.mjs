import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import ts from "typescript"

function load(source, imports, env = {}) {
    const exports = {}
    vm.runInNewContext(ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText, {
        exports, Buffer, process: { env },
        require: name => {
            if (name === "server-only") return {}
            if (name in imports) return imports[name]
            throw new Error(`Unexpected import: ${name}`)
        },
    })
    return exports
}
const types = load(await readFile("lib/types.ts", "utf8"), {})
const normalize = load(await readFile("lib/store/normalize.ts", "utf8"), { "@/lib/types": types })
const documents = new Map()
let uuid = 0
function makeClient(perspective = "published") { return {
    withConfig: options => makeClient(options.perspective || perspective),
    create: async doc => {
        const created = { ...doc, _updatedAt: new Date().toISOString() }
        documents.set(created._id, created)
        return created
    },
    createIfNotExists: async doc => {
        if (!documents.has(doc._id)) documents.set(doc._id, { ...doc })
        return documents.get(doc._id)
    },
    fetch: async (query, params) => {
        const docs = [...documents.values()].filter(d => perspective === "raw" || !d._id.startsWith("drafts."))
        const shape = d => query.includes('"slug": slug.current') ? { ...d, slug: d.slug.current } : { ...d }
        if (params?.id) {
            const doc = docs.find(d => d._id === params.draftId) || docs.find(d => d._id === params.id)
            return doc ? shape(doc) : null
        }
        if (params?.slug) {
            const matched = docs.filter(d => d.slug.current === params.slug)
            const doc = matched.find(d => d._id.startsWith("drafts.")) || matched[0]
            return doc ? shape(doc) : null
        }
        return docs.map(shape)
    },
    patch: id => ({
        set: patch => ({ commit: async () => documents.set(id, { ...documents.get(id), ...patch }) }),
    }),
    transaction: () => {
        const operations = []
        const tx = {
            createOrReplace: doc => { operations.push(() => documents.set(doc._id, { ...doc })); return tx },
            delete: id => { operations.push(() => documents.delete(id)); return tx },
            commit: async () => operations.forEach(run => run()),
        }
        return tx
    },
} }
const client = makeClient()
const adapter = load(await readFile("lib/store/sanity-store.ts", "utf8"), {
    "next-sanity": { createClient: () => client },
    "node:crypto": { randomUUID: () => `generated-${++uuid}` },
    "next/navigation": { unstable_rethrow: () => {} },
    "@/sanity/env": { apiVersion: "2024-12-27", dataset: "staging", projectId: "test", writeToken: "test-only" },
    "@/sanity/lib/image": { urlForImage: () => ({ url: () => "https://cdn.sanity.io/test.svg" }) },
    "@/lib/types": types,
    "./normalize": normalize,
})
const store = adapter.createSanityStore()
const input = {
    title: "A correct slug", slug: "a-correct-slug", section: "news",
    content: "Body", imageUrl: "https://cdn.sanity.io/cover.svg", imageAlt: "Cover",
    imageCredit: "Original illustration", demo: true, demoBatch: "test-batch",
    status: "published", featured: true,
}
const first = await store.createArticle(input)
assert.equal(first.slug, "a-correct-slug")
await store.updateArticle(first.id, { featured: false })
let updated = await store.getArticle(first.id)
assert.equal(updated.imageUrl, input.imageUrl)
assert.equal(updated.imageAlt, input.imageAlt)
assert.equal(updated.imageCredit, input.imageCredit)
assert.equal(updated.demo, true)
assert.equal(updated.demoBatch, "test-batch")
await store.updateArticle(first.id, { status: "draft" })
assert.equal((await store.getArticle(first.id)).imageUrl, input.imageUrl)
assert(documents.has(`drafts.${first.id}`))
assert(!documents.has(first.id))
assert.equal(await store.getArticle(first.id, false), null)
assert.equal((await store.listArticles(false)).length, 0)
assert.equal(await store.getArticleBySlug(input.slug, false), null)
await store.updateArticle(first.id, { imageUrl: undefined })
assert.equal((await store.getArticle(first.id)).imageUrl, undefined)
await store.updateArticle(first.id, { status: "published", imageUrl: input.imageUrl })
assert(!documents.has(`drafts.${first.id}`))
assert.equal((await store.getArticle(first.id, false)).status, "published")
const a = await store.createArticle(input, "deterministic-demo")
await store.updateArticle(a.id, { title: "Human edit" })
const b = await store.createArticle({ ...input, title: "Would overwrite" }, "deterministic-demo")
assert.equal(b.title, "Human edit")
assert.equal(b.id, a.id)
assert.equal(documents.size, 2)
const draft = await store.createArticle({ ...input, slug: "new-draft", status: "draft" })
assert(documents.has(`drafts.${draft.id}`))
assert.equal(await store.getArticle(draft.id, false), null)
await store.deleteArticle(draft.id)
assert(!documents.has(`drafts.${draft.id}`))
const page = await store.createPage({ title: "Private page", slug: "private-page", status: "draft", content: "Private" })
assert.equal(page.slug, "private-page")
assert.equal(await store.getPageBySlug(page.slug, false), null)
await store.updatePage(page.id, { status: "published" })
assert.equal((await store.getPageBySlug(page.slug, false)).content, "Private")
await store.updatePage(page.id, { status: "draft" })
assert.equal(await store.getPageBySlug(page.slug, false), null)
await store.deletePage(page.id)

const stories = load(await readFile("lib/demo-content.ts", "utf8"), {})
const artwork = load(await readFile("lib/demo-artwork.ts", "utf8"), {})
const env = { VERCEL_ENV: "preview", NEXT_PUBLIC_SANITY_PROJECT_ID: "test", NEXT_PUBLIC_SANITY_DATASET: "staging", NODE_ENV: "production" }
const seed = load(await readFile("lib/demo-seed.ts", "utf8"), {
    "@/lib/store/normalize": normalize, "@/lib/demo-artwork": artwork, "@/lib/demo-content": stories,
}, env)
assert.equal(seed.demoSeedEnabled(), true)
env.VERCEL_ENV = "production"
assert.equal(seed.demoSeedEnabled(), false)
env.VERCEL_ENV = "preview"
env.NEXT_PUBLIC_SANITY_DATASET = "production"
assert.equal(seed.demoSeedEnabled(), false)
env.NEXT_PUBLIC_SANITY_PROJECT_ID = ""
env.NODE_ENV = "development"
env.CMS_TEST_CONTENT_DIR = "/isolated-fixture"
assert.equal(seed.demoSeedEnabled(), true)
env.NODE_ENV = "production"
assert.equal(seed.demoSeedEnabled(), false)
assert.equal(stories.DEMO_STORIES.length, 17)
assert.equal(new Set(stories.DEMO_STORIES.map(s => s.slug)).size, 17)
for (const [index, s] of stories.DEMO_STORIES.entries()) {
    assert(s.content.split(/\s+/).length >= 230, s.slug)
    const svg = artwork.coverSvg(s.artwork, index, s.category)
    assert(svg.includes('width="1440"'))
    assert(!/<script|foreignObject|href=|onload=|https?:\/\//i.test(svg.replace("http://www.w3.org/2000/svg", "")))
    if (s.diagram) assert(artwork.diagramSvg(s.diagram).includes("SIMPLIFIED CONCEPT"))
}
for (const section of ["news", "reviews", "how-to", "how-stuff-works", "tech-kenya", ""]) {
    const route = await readFile(`app/(site)/${section ? `${section}/` : ""}[slug]/page.tsx`, "utf8")
    assert(route.includes('export const dynamic = "force-dynamic"'), section)
    assert(!route.includes("generateStaticParams"), section)
}
console.log("PASS: Sanity private draft paths, atomic article/page publishing and unpublishing, stable ids, slug normalization, sparse image patches, demo metadata, create-only imports, production guards, 17 source-linked stories, safe SVG illustrations and request-time article routes.")
