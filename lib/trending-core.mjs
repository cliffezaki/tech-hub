import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export const MAX_AGE = 48 * 60 * 60 * 1000
export const SOURCES = [
    { name: "BBC Technology", feed: "https://feeds.bbci.co.uk/news/technology/rss.xml", hosts: ["www.bbc.com", "www.bbc.co.uk", "bbc.com", "bbc.co.uk"] },
    { name: "The Verge", feed: "https://www.theverge.com/rss/index.xml", hosts: ["www.theverge.com", "theverge.com"] },
    { name: "TechCrunch", feed: "https://techcrunch.com/feed/", hosts: ["techcrunch.com", "www.techcrunch.com"] },
    { name: "Ars Technica", feed: "https://feeds.arstechnica.com/arstechnica/index", hosts: ["arstechnica.com", "www.arstechnica.com"] },
]
export const hash = value => createHash("sha256").update(value).digest("hex")
export const words = value => String(value || "").trim().split(/\s+/).filter(Boolean)
export function clean(value) {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|quot|apos|lt|gt);/g, entity => ({ "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" })[entity]).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
}
export function safeUrl(value, source) {
    try {
        const url = new URL(value)
        if (url.protocol !== "https:" || url.username || url.password || url.port || !source.hosts.includes(url.hostname)) return null
        url.hash = ""
        for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid|gclid)/.test(key)) url.searchParams.delete(key)
        return url.href
    } catch { return null }
}
export function similarity(a, b) {
    const tokens = text => new Set(text.toLowerCase().match(/[a-z0-9]{3,}/g)?.filter(w => !["the","and","for","with","from","that","this","has","are","its","new"].includes(w)) || [])
    const left = tokens(a), right = tokens(b)
    const common = [...left].filter(word => right.has(word)).length
    return common / Math.max(1, Math.min(left.size, right.size))
}
export function candidates(items, now = Date.now()) {
    const seen = new Set()
    return items.filter(item => {
        const age = now - Date.parse(item.publishedAt)
        if (!Number.isFinite(age) || age < -5 * 60 * 1000 || age > 36 * 60 * 60 * 1000 || words(item.text).length < 12) return false
        if (!/\b(ai|artificial intelligence|software|tech|cyber|security|chip|computer|apple|google|microsoft|meta|openai|anthropic|samsung|phone|gadget|data|robot|internet|app|nvidia)\b/i.test(item.title + " " + item.text)) return false
        if (/\b(deals?|coupon|discount|sponsored|horoscope|wordle|crossword|promo code)\b/i.test(item.title)) return false
        if (seen.has(item.url)) return false
        seen.add(item.url)
        return true
    }).sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0,48)
}
export function validateStories(result, items, now = Date.now()) {
    if (!Array.isArray(result?.stories)) throw new Error("Invalid summary response")
    const stories = [], used = new Set()
    for (const raw of result.stories.slice(0,10)) {
        if (!raw || ![raw.headline,raw.summary,raw.detail,raw.whyItMatters].every(v=>typeof v==="string" && !/[<>]/.test(v))) continue
        const draft={...raw,...Object.fromEntries(["headline","summary","detail","whyItMatters"].map(key=>[key,clean(raw[key])]))}
        if (!draft || ![draft.headline,draft.summary,draft.detail,draft.whyItMatters].every(v => typeof v === "string" && v === clean(v) && !/[<>]/.test(v))) continue
        const refs = Array.isArray(draft.sourceIds) ? [...new Set(draft.sourceIds)].map(id=>items.find(item=>item.id===id)) : []
        // Prefer corroboration; accept substantial attributed reporting from an allowlisted publisher.
        if (refs.length < 1 || refs.some(ref=>!ref)) continue
        if (refs.some(ref=>used.has(ref.id))) continue
        if (refs.length===1 && !draft.summary.toLowerCase().includes(refs[0].source.toLowerCase())) continue
        if (words(draft.summary).length < 30 || words(draft.summary).length > 60 || words(draft.detail).length < 45 || words(draft.detail).length > 130 || words(draft.whyItMatters).length < 10 || words(draft.whyItMatters).length > 45 || draft.headline.length < 15 || draft.headline.length > 150) continue
        if (stories.some(story=>similarity(story.headline,draft.headline)>=.6)) continue
        const evidence=refs.map(ref=>ref.title+" "+ref.text).join(" ")
        if(words(evidence).length < (refs.length===1 ? 90 : 60))continue
        const output=[draft.headline,draft.summary,draft.detail,draft.whyItMatters].join(" ")
        // Reject unsupported numeric claims and copied runs of 12 words.
        const numbers=output.match(/\d+(?:[.,]\d+)*(?:%|\b)/g)||[]
        if(numbers.some(number=>!evidence.includes(number))) continue
        const outputWords=words(output.toLowerCase()), evidenceWords=words(evidence.toLowerCase()).join(" ")
        if(outputWords.some((_,i)=>i+12<=outputWords.length&&evidenceWords.includes(outputWords.slice(i,i+12).join(" ")))) continue
        const expiresAt = new Date(Math.min(...refs.map(ref=>Date.parse(ref.publishedAt))) + MAX_AGE).toISOString()
        if(Date.parse(expiresAt)<=now) continue
        refs.forEach(ref=>used.add(ref.id))
        stories.push({id:hash(refs.map(ref=>ref.url).sort().join("|")).slice(0,24),headline:draft.headline,summary:draft.summary,detail:draft.detail,whyItMatters:draft.whyItMatters,existingId:typeof draft.existingId==="string"?draft.existingId:undefined,publishedAt:new Date(Math.max(...refs.map(ref=>Date.parse(ref.publishedAt)))).toISOString(),sources:refs.map(ref=>({name:ref.source,url:ref.url})),expiresAt})
    }
    return stories.slice(0,7)
}
export function signature(secret, timestamp) { return createHmac("sha256",secret).update(`trending-refresh:${timestamp}`).digest("hex") }
export function authenticated(request, secret, now=Date.now()) {
    if (!secret) return false
    const timestamp = request.headers.get("x-trending-time") || ""
    const signed = request.headers.get("x-trending-signature") || ""
    if (!/^\d{13}$/.test(timestamp) || Math.abs(now-Number(timestamp))>60000 || !/^[a-f0-9]{64}$/.test(signed)) return false
    return timingSafeEqual(Buffer.from(signed,"hex"),Buffer.from(signature(secret,timestamp),"hex"))
}

// Keep a rolling, bounded feed. Source dates determine order, never generation time.
export function mergeStories(previous=[],incoming=[],now=Date.now()) {
    const date=story=>Date.parse(story.publishedAt)||Date.parse(story.expiresAt)-MAX_AGE
    const active=previous.filter(story=>Date.parse(story.expiresAt)>now)
    for(const story of incoming){
        if(Date.parse(story.expiresAt)<=now)continue
        const index=active.findIndex(old=>old.id===story.id || story.sources.some(s=>old.sources.some(o=>o.url===s.url)) || similarity(old.headline,story.headline)>=.5 || (old.id===story.existingId && similarity(old.headline,story.headline)>=.3))
        const {existingId,...cleanStory}=story
        if(index>=0)active[index]={...cleanStory,id:active[index].id}
        else active.push(cleanStory)
    }
    return active.sort((a,b)=>date(b)-date(a)).slice(0,7)
}
