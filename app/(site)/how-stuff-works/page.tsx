import type { Metadata } from "next"

import { SectionPage } from "@/components/section-page"
import { SECTION_META } from "@/lib/types"

export const metadata: Metadata = {
    title: SECTION_META["how-stuff-works"].title,
    description: SECTION_META["how-stuff-works"].subtitle,
}

export default function Page() {
    return <SectionPage section="how-stuff-works" />
}
