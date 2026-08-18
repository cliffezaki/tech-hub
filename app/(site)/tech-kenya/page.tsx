import type { Metadata } from "next"

import { SectionPage } from "@/components/section-page"
import { SECTION_META } from "@/lib/types"

export const metadata: Metadata = {
    title: SECTION_META["tech-kenya"].title,
    description: SECTION_META["tech-kenya"].subtitle,
}

export default function Page() {
    return <SectionPage section="tech-kenya" />
}
