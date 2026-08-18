/**
 * Writes the starter content into the local JSON store (`content/`).
 *
 * Run with `npm run seed`. Existing files with the same ids are replaced, so this is
 * also the way to reset the demo site back to a known state.
 */

import fs from "node:fs"
import path from "node:path"

import { buildArticles, demoPages, demoSettings } from "./demo-content.mjs"

const root = process.cwd()
const articlesDir = path.join(root, "content", "articles")
const pagesDir = path.join(root, "content", "pages")
const settingsFile = path.join(root, "content", "settings.json")

fs.mkdirSync(articlesDir, { recursive: true })
fs.mkdirSync(pagesDir, { recursive: true })

const articles = buildArticles()

// Remove stale demo files so renamed or deleted entries do not linger.
for (const fileName of fs.readdirSync(articlesDir)) {
    if (fileName.endsWith(".json")) {
        fs.unlinkSync(path.join(articlesDir, fileName))
    }
}

for (const article of articles) {
    fs.writeFileSync(path.join(articlesDir, `${article.id}.json`), `${JSON.stringify(article, null, 2)}\n`)
}

for (const page of demoPages) {
    fs.writeFileSync(
        path.join(pagesDir, `${page.id}.json`),
        `${JSON.stringify({ ...page, updatedAt: new Date().toISOString() }, null, 2)}\n`
    )
}

fs.writeFileSync(settingsFile, `${JSON.stringify(demoSettings, null, 2)}\n`)

const images = new Set(articles.map((article) => article.imageUrl))

console.log(`Seeded ${articles.length} articles (${images.size} unique images)`)
console.log(`Seeded ${demoPages.length} pages and site settings`)
