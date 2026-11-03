import "server-only"
import { getRecord, listRecords, platformReady } from "@/lib/platform-store"
import type { RecordData } from "@/lib/modules"
export async function activeAds(slot: string, pathname: string) {
    if (!platformReady()) return []
    const [placements, campaigns, creatives] = await Promise.all([
        listRecords<RecordData>("placements"),
        listRecords<RecordData>("campaigns"),
        listRecords<RecordData>("creatives"),
    ])
    const today = new Date().toISOString().slice(0, 10)
    const ads = placements
        .filter(
            (p) =>
                p.slot === slot &&
                p.enabled &&
                (!p.paths ||
                    String(p.paths)
                        .split(",")
                        .some(
                            (path) =>
                                pathname === path.trim() ||
                                pathname.startsWith(path.trim() + "/")
                        ))
        )
        .flatMap((placement) => {
            const matched = campaigns.filter(
                (c) =>
                    c.placementId === placement.id &&
                    ["active", "scheduled"].includes(String(c.status)) &&
                    String(c.start) <= today &&
                    String(c.end) >= today
            )
            return matched.slice(0, 1).flatMap((c) => {
                const creative = creatives.find((a) => a.id === c.creativeId)
                return creative &&
                    /^https?:\/\//.test(String(creative.destination))
                    ? [
                          {
                              id: c.id,
                              placement: placement.id,
                              creative: {
                                  name: creative.name,
                                  imageUrl: creative.imageUrl,
                                  mobileImageUrl: creative.mobileImageUrl,
                                  alt: creative.alt,
                                  text: creative.text,
                                  cta: creative.cta,
                                  destination: creative.destination,
                              },
                          },
                      ]
                    : []
            })
        })
    return ads
}
export async function publishingConfig() {
    return platformReady()
        ? await getRecord<RecordData>("config", "publishing")
        : null
}
