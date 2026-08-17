import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const articlesDir = path.join(root, "content", "articles")
const pagesDir = path.join(root, "content", "pages")

fs.mkdirSync(articlesDir, { recursive: true })
fs.mkdirSync(pagesDir, { recursive: true })

const images = {
    aiChip: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    aiWorkspace: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1400&q=80",
    security: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1400&q=80",
    smartphone: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80",
    phoneHand: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1400&q=80",
    foldable: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1400&q=80",
    data: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1400&q=80",
    hardware: "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=1400&q=80",
    science: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=1400&q=80",
    tutorial: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1400&q=80",
    privacy: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1400&q=80",
    energy: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1400&q=80",
    kenya: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1400&q=80",
    fiber: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1400&q=80",
}

const publishedBase = Date.UTC(2026, 4, 15, 9, 0, 0)

function article({ id, title, slug, excerpt, category, section, author, readTime, imageUrl }, index) {
    return {
        id,
        title,
        slug,
        excerpt,
        content: `# ${title}

${excerpt}

## What matters

- This is editable starter content.
- Replace this section with your own reporting, review notes, or guide steps.
- Keep the category and section fields updated so the story appears in the right part of the site.

## Editor notes

This demo article was seeded into the local CMS so the website feels complete while you prepare real content. You can edit or delete it from the dashboard.`,
        category,
        section,
        author,
        publishedAt: new Date(publishedBase - index * 60 * 60 * 1000).toISOString(),
        readTime,
        imageUrl,
    }
}

const articles = [
    article({
        id: "next-generation-generative-models",
        title: "The Next Generation of Generative Models is Here",
        slug: "next-generation-generative-models",
        excerpt: "Breakthroughs in reasoning capabilities are setting new benchmarks for AI performance, changing how we interact with machines forever.",
        category: "Artificial Intelligence",
        section: "news",
        author: "Will Knight",
        readTime: "5 min read",
        imageUrl: images.aiChip,
    }, 0),
    article({
        id: "open-web-dying",
        title: "Why The Open Web is Dying",
        slug: "open-web-dying",
        excerpt: "The centralized platforms are winning. Here's what we're losing.",
        category: "Analysis",
        section: "news",
        author: "GIUSEPPE STUTO",
        readTime: "8 min read",
        imageUrl: images.aiWorkspace,
    }, 1),
    article({
        id: "grid-hack",
        title: "The Hack That Could Take Down The Grid",
        slug: "grid-hack",
        excerpt: "Security researchers discovered critical vulnerabilities in power infrastructure.",
        category: "Security",
        section: "news",
        author: "ANDY GREENBERG",
        readTime: "12 min read",
        imageUrl: images.security,
    }, 2),
    article({
        id: "agi-achieved",
        title: "AGI Achieved Internally?",
        slug: "agi-achieved",
        excerpt: "Rumors swirl as a tech giant claims a breakthrough in reasoning models.",
        category: "AI",
        section: "news",
        author: "Staff Writer",
        readTime: "3 min read",
        imageUrl: images.aiChip,
    }, 3),
    article({
        id: "agentic-web",
        title: "The Agentic Web is Here",
        slug: "agentic-web",
        excerpt: "How autonomous agents are rewriting the rules of the internet.",
        category: "Analysis",
        section: "news",
        author: "Staff Writer",
        readTime: "5 min read",
        imageUrl: images.aiWorkspace,
    }, 4),
    article({
        id: "llama-4",
        title: "Open Source Llama 4",
        slug: "llama-4",
        excerpt: "Meta releases its most powerful model yet, beating proprietary systems.",
        category: "Open Source",
        section: "news",
        author: "Staff Writer",
        readTime: "4 min read",
        imageUrl: images.data,
    }, 5),
    article({
        id: "silicon-valley-obsession",
        title: "Silicon Valley's New Obsession",
        slug: "silicon-valley-obsession",
        excerpt: "Why VCs are pouring billions into agentic workflows.",
        category: "Startups",
        section: "news",
        author: "Lauren Goode",
        readTime: "4 min read",
        imageUrl: images.data,
    }, 6),
    article({
        id: "eu-ai-act",
        title: "EU AI Act: What You Need to Know",
        slug: "eu-ai-act",
        excerpt: "Comprehensive regulation is coming. Here's how it impacts open source.",
        category: "Policy",
        section: "news",
        author: "Khari Johnson",
        readTime: "6 min read",
        imageUrl: images.security,
    }, 7),
    article({
        id: "nvidia-chip",
        title: "NVIDIA's New Chip Crushes Benchmarks",
        slug: "nvidia-chip",
        excerpt: "The H200 is faster, more efficient, and already sold out.",
        category: "Hardware",
        section: "news",
        author: "Julian Chokkattu",
        readTime: "3 min read",
        imageUrl: images.hardware,
    }, 8),
    article({
        id: "alphafold-3",
        title: "AlphaFold 3 Predicts Life's Molecules",
        slug: "alphafold-3",
        excerpt: "DeepMind's latest model creates 3D models of DNA, RNA, and ligands.",
        category: "Science",
        section: "news",
        author: "Amit Katwala",
        readTime: "7 min read",
        imageUrl: images.science,
    }, 9),
    article({
        id: "iphone-16-pro-review",
        title: "iPhone 16 Pro Review",
        slug: "iphone-16-pro-review",
        excerpt: "The refinement king. Better cameras, new button, same soul.",
        category: "Smartphone",
        section: "reviews",
        author: "Julian Chokkattu",
        readTime: "9 min read",
        imageUrl: images.smartphone,
    }, 10),
    article({
        id: "google-pixel-9-pro",
        title: "Google Pixel 9 Pro",
        slug: "google-pixel-9-pro",
        excerpt: "AI in your pocket. The smartest smartphone gets a major design overhaul.",
        category: "Smartphone",
        section: "reviews",
        author: "Julian Chokkattu",
        readTime: "8 min read",
        imageUrl: images.phoneHand,
    }, 11),
    article({
        id: "samsung-galaxy-s25-ultra",
        title: "Samsung Galaxy S25 Ultra",
        slug: "samsung-galaxy-s25-ultra",
        excerpt: "Titanium perfection? Testing the limits of Android performance.",
        category: "Smartphone",
        section: "reviews",
        author: "Julian Chokkattu",
        readTime: "5 min read",
        imageUrl: images.smartphone,
    }, 12),
    article({
        id: "nothing-phone-3",
        title: "Nothing Phone (3)",
        slug: "nothing-phone-3",
        excerpt: "Transparent design meets flagship specs. Is it enough?",
        category: "Smartphone",
        section: "reviews",
        author: "Julian Chokkattu",
        readTime: "6 min read",
        imageUrl: images.phoneHand,
    }, 13),
    article({
        id: "iphone-16-pro-max",
        title: "iPhone 16 Pro Max: The Battery King",
        slug: "iphone-16-pro-max",
        excerpt: "With a larger display and the longest battery life ever in an iPhone, this is the one to beat.",
        category: "Flagship",
        section: "reviews",
        author: "Julian Chokkattu",
        readTime: "9 min read",
        imageUrl: images.smartphone,
    }, 14),
    article({
        id: "oneplus-open-2",
        title: "OnePlus Open 2: Perfection Folded",
        slug: "oneplus-open-2",
        excerpt: "The best foldable phone gets even better with refined software and lighter hardware.",
        category: "Foldable",
        section: "reviews",
        author: "Boone Ashworth",
        readTime: "7 min read",
        imageUrl: images.foldable,
    }, 15),
    article({
        id: "pixel-9a",
        title: "Pixel 9a: Still the Camera Champ",
        slug: "pixel-9a",
        excerpt: "Google proves you don't need to spend $1000 for flagship-quality photos.",
        category: "Budget",
        section: "reviews",
        author: "Nena Farrell",
        readTime: "6 min read",
        imageUrl: images.phoneHand,
    }, 16),
    article({
        id: "llama-3-mac",
        title: "How to Run Llama 3 Locally on Your Mac",
        slug: "llama-3-mac",
        excerpt: "Stop paying for API credits. Here is how to get a local LLM running in minutes.",
        category: "Software",
        section: "how-to",
        author: "Reece Rogers",
        readTime: "15 min read",
        imageUrl: images.tutorial,
    }, 17),
    article({
        id: "scrub-data-ai",
        title: "How to Scrub Your Data From AI Training Sets",
        slug: "scrub-data-ai",
        excerpt: "Opt-out tools are hidden and confusing. We guide you through the process.",
        category: "Privacy",
        section: "how-to",
        author: "David Nield",
        readTime: "8 min read",
        imageUrl: images.privacy,
    }, 18),
    article({
        id: "fusion-energy",
        title: "How Fusion Energy Actually Works",
        slug: "fusion-energy",
        excerpt: "We are closer than ever to unlimited clean energy. Here is the science behind the headlines.",
        category: "Physics",
        section: "how-stuff-works",
        author: "Steven Levy",
        readTime: "12 min read",
        imageUrl: images.energy,
    }, 19),
    article({
        id: "what-is-npu",
        title: "What is a Neural Processing Unit (NPU)?",
        slug: "what-is-npu",
        excerpt: "Why your next laptop needs a dedicated AI chip and what it actually does.",
        category: "Computing",
        section: "how-stuff-works",
        author: "Will Knight",
        readTime: "6 min read",
        imageUrl: images.hardware,
    }, 20),
    article({
        id: "nairobi-fintech",
        title: "Nairobi's Fintech Boom Continues",
        slug: "nairobi-fintech",
        excerpt: "Local startups are solving payments for the unbanked across the continent.",
        category: "Startups",
        section: "tech-kenya",
        author: "Local Correspondent",
        readTime: "6 min read",
        imageUrl: images.kenya,
    }, 21),
    article({
        id: "fiber-expansion",
        title: "Fiber Expansion Reaches Rural Counties",
        slug: "fiber-expansion",
        excerpt: "High-speed internet is finally coming to the most remote parts of the country.",
        category: "Infrastructure",
        section: "tech-kenya",
        author: "Local Correspondent",
        readTime: "5 min read",
        imageUrl: images.fiber,
    }, 22),
]

for (const item of articles) {
    const file = path.join(articlesDir, `${item.id}.json`)
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, `${JSON.stringify(item, null, 2)}\n`)
    }
}

const pages = [
    {
        id: "about",
        title: "About Tech Hub",
        slug: "about",
        status: "draft",
        excerpt: "A short page for explaining your publication, mission, and editorial focus.",
        content: "# About Tech Hub\n\nUse this page to describe your publication, team, audience, and editorial mission.",
        updatedAt: new Date().toISOString(),
    },
    {
        id: "advertise",
        title: "Advertise",
        slug: "advertise",
        status: "draft",
        excerpt: "A starter page for sponsorships, partnerships, and media kit information.",
        content: "# Advertise\n\nAdd your advertising packages, audience profile, contact details, and partnership options here.",
        updatedAt: new Date().toISOString(),
    },
]

for (const page of pages) {
    const file = path.join(pagesDir, `${page.id}.json`)
    if (!fs.existsSync(file)) {
        fs.writeFileSync(file, `${JSON.stringify(page, null, 2)}\n`)
    }
}

console.log(`Seeded ${articles.length} articles and ${pages.length} pages.`)
