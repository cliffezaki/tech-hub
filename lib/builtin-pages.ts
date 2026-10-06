import { ARTICLE_SECTIONS, SECTION_META, type PageContent } from "@/lib/types"
// Virtual entries represent existing routes. Saving one creates its first CMS record,
// or updates the existing matching slug; importing does not create duplicate documents.
export const BUILTIN_PAGES: PageContent[] = [
    ...ARTICLE_SECTIONS.map((slug) => ({
        id: `builtin-${slug}`,
        slug,
        title: SECTION_META[slug].title,
        excerpt: SECTION_META[slug].subtitle,
        content: "",
        status: "published" as const,
        updatedAt: "",
    })),
    {
        id: "builtin-contact",
        slug: "contact",
        title: "Contact Us",
        excerpt: "Get in touch with the Tech Hub team.",
        content: "",
        status: "published",
        updatedAt: "",
    },
    {
        id: "builtin-about",
        slug: "about",
        title: "About Us",
        excerpt: "Technology news, reviews, and guides.",
        content:
            "Tech Hub covers technology and the ideas shaping everyday life. Explore our news, reviews, explainers and coverage from Kenya.",
        status: "published",
        updatedAt: "",
    },
    {
        id: "builtin-advertise",
        slug: "advertise",
        title: "Advertise With Us",
        excerpt:
            "Connect your brand with readers exploring technology, products, and the ideas behind them.",
        content:
            "## Why advertise with us\nReach readers alongside focused technology journalism. We work with brands on clearly labelled campaigns that fit our publication.\n\n## Our audience\nTech Hub covers news, reviews, how-to guides, explainers, and technology in Kenya. Verified audience figures can be shared when measurements are available.\n\n## Advertising opportunities\nDiscuss homepage and section banners, in-article placements, category sponsorships, sponsored articles and custom partnerships with our team.\n\n## Available placements\nHeader, homepage, article, section, sidebar and footer placements may be available, subject to scheduling.\n\n## Sponsored content\nSponsored stories and paid partnerships are clearly disclosed to readers. Editorial suitability is reviewed before publication.\n\n## Partnerships\nTell us your objectives, audience and timeline so we can discuss an appropriate package.\n\n## Frequently asked questions\n### How do I request a proposal?\nComplete the inquiry form below with your campaign goals and preferred dates.\n\n### Are prices fixed?\nPackages and custom proposals depend on placement, duration and availability.\n\n### Do you guarantee results?\nNo. Available campaign measurements report recorded impressions and clicks; they are not a guarantee of sales.",
        status: "published",
        updatedAt: "",
    },
    {
        id: "builtin-privacy",
        slug: "privacy",
        title: "Privacy Policy",
        excerpt:
            "How this site uses account, inquiry, and analytics information.",
        content:
            "We store account details to provide sign-in and subscription preferences. Advertising inquiry details are used to respond to your request. Optional first-party analytics run only after you allow them. These measurements use a random browser identifier, visited page paths, referrer domains, browser and device category, and ad interactions. We do not infer age, gender or precise location. You can change your analytics choice using Privacy choices and change your subscription in Account. Contact the publisher through the Contact page for questions or requests concerning your information.",
        status: "draft",
        updatedAt: "",
    },
    {
        id: "builtin-terms",
        slug: "terms",
        title: "Terms of Use",
        excerpt: "Publication terms",
        content: "",
        status: "draft",
        updatedAt: "",
    },
]
export function mergeBuiltinPages(pages: PageContent[]) {
    return [
        ...pages,
        ...BUILTIN_PAGES.filter((b) => !pages.some((p) => p.slug === b.slug)),
    ]
}
