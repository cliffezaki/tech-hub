import type { Metadata } from "next"

import { SectionPage } from "@/components/section-page"
import { SECTION_META } from "@/lib/types"

export const metadata: Metadata = {
    title: SECTION_META["reviews"].title,
    description: SECTION_META["reviews"].subtitle,
}

export default function Page() {
    return <SectionPage section="reviews" />
}
