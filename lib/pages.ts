import fs from "fs"
import path from "path"
import type { PageContent } from "./types"

const pagesDirectory = path.join(process.cwd(), "content", "pages")

if (!fs.existsSync(pagesDirectory)) {
    fs.mkdirSync(pagesDirectory, { recursive: true })
}

function generateId() {
    return Math.random().toString(36).substring(2, 9)
}

export async function getPages(): Promise<PageContent[]> {
    return fs
        .readdirSync(pagesDirectory)
        .filter((fileName) => fileName.endsWith(".json"))
        .map((fileName) => {
            const fullPath = path.join(pagesDirectory, fileName)
            return JSON.parse(fs.readFileSync(fullPath, "utf8")) as PageContent
        })
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

export async function getPage(id: string): Promise<PageContent | null> {
    const fullPath = path.join(pagesDirectory, `${id}.json`)

    if (!fs.existsSync(fullPath)) {
        return null
    }

    return JSON.parse(fs.readFileSync(fullPath, "utf8")) as PageContent
}

export async function createPage(data: Omit<PageContent, "id" | "updatedAt">): Promise<PageContent> {
    const id = generateId()
    const page: PageContent = {
        ...data,
        id,
        updatedAt: new Date().toISOString(),
    }

    fs.writeFileSync(path.join(pagesDirectory, `${id}.json`), JSON.stringify(page, null, 2))
    return page
}

export async function updatePage(id: string, data: Partial<PageContent>): Promise<PageContent | null> {
    const current = await getPage(id)

    if (!current) {
        return null
    }

    const page: PageContent = {
        ...current,
        ...data,
        id,
        updatedAt: new Date().toISOString(),
    }

    fs.writeFileSync(path.join(pagesDirectory, `${id}.json`), JSON.stringify(page, null, 2))
    return page
}

export async function deletePage(id: string): Promise<boolean> {
    const fullPath = path.join(pagesDirectory, `${id}.json`)

    if (!fs.existsSync(fullPath)) {
        return false
    }

    fs.unlinkSync(fullPath)
    return true
}
