import { createHash, createHmac, timingSafeEqual } from "node:crypto"

export const MAX_AGE = 48 * 60 * 60 * 1000
export const SOURCES = [
    { name: "BBC Technology", group:"bbc", feed: "https://feeds.bbci.co.uk/news/technology/rss.xml", hosts: ["www.bbc.com", "www.bbc.co.uk", "bbc.com", "bbc.co.uk"] },
    { name: "The Verge", group:"vox", feed: "https://www.theverge.com/rss/index.xml", hosts: ["www.theverge.com", "theverge.com"] },
    { name: "TechCrunch", group:"regent", feed: "https://techcrunch.com/feed/", hosts: ["techcrunch.com", "www.techcrunch.com"] },
    { name: "Ars Technica", group:"conde-nast", feed: "https://feeds.arstechnica.com/arstechnica/index", hosts: ["arstechnica.com", "www.arstechnica.com"] },
    {"name": "WIRED", "feed": "https://www.wired.com/feed/rss", "hosts": ["www.wired.com", "wired.com"], "group": "conde-nast", "primary": false},
    {"name": "Engadget", "feed": "https://www.engadget.com/rss.xml", "hosts": ["www.engadget.com", "engadget.com"], "group": "yahoo", "primary": false},
    {"name": "CNET", "feed": "https://www.cnet.com/rss/news/", "hosts": ["www.cnet.com", "cnet.com"], "group": "ziff-davis", "primary": false},
    {"name": "ZDNET", "feed": "https://www.zdnet.com/news/rss.xml", "hosts": ["www.zdnet.com", "zdnet.com"], "group": "ziff-davis", "primary": false},
    {"name": "The Register", "feed": "https://www.theregister.com/headlines.atom", "hosts": ["www.theregister.com", "theregister.com"], "group": "register", "primary": false},
    {"name": "9to5Mac", "feed": "https://9to5mac.com/feed/", "hosts": ["9to5mac.com", "www.9to5mac.com"], "group": "9to5", "primary": false},
    {"name": "Android Authority", "feed": "https://www.androidauthority.com/feed/", "hosts": ["www.androidauthority.com", "androidauthority.com"], "group": "android-authority", "primary": false},
    {"name": "CNBC Technology", "feed": "https://www.cnbc.com/id/19854910/device/rss/rss.html", "hosts": ["www.cnbc.com", "cnbc.com"], "group": "nbc", "primary": false},
    {"name": "MIT Technology Review", "feed": "https://www.technologyreview.com/feed/", "hosts": ["www.technologyreview.com", "technologyreview.com"], "group": "mit-review", "primary": false},
    {"name": "The Guardian Technology", "feed": "https://www.theguardian.com/uk/technology/rss", "hosts": ["www.theguardian.com", "theguardian.com"], "group": "guardian", "primary": false},
    {"name": "BleepingComputer", "feed": "https://www.bleepingcomputer.com/feed/", "hosts": ["www.bleepingcomputer.com", "bleepingcomputer.com"], "group": "bleepingcomputer", "primary": false},
    {"name": "Krebs on Security", "feed": "https://krebsonsecurity.com/feed/", "hosts": ["krebsonsecurity.com", "www.krebsonsecurity.com"], "group": "krebs", "primary": false},
    {"name": "Google", "feed": "https://blog.google/rss/", "hosts": ["blog.google", "blog.google.com"], "group": "google", "primary": true},
    {"name": "Microsoft", "feed": "https://blogs.microsoft.com/feed/", "hosts": ["blogs.microsoft.com", "www.microsoft.com", "microsoft.com"], "group": "microsoft", "primary": true},
    {"name": "OpenAI", "feed": "https://openai.com/news/rss.xml", "hosts": ["openai.com", "www.openai.com"], "group": "openai", "primary": true},
    {"name": "CISA", "feed": "https://www.cisa.gov/cybersecurity-advisories/all.xml", "hosts": ["www.cisa.gov", "cisa.gov"], "group": "cisa", "primary": true},
    {"name": "FTC", "feed": "https://www.ftc.gov/feeds/press-release.xml", "hosts": ["www.ftc.gov", "ftc.gov"], "group": "ftc", "primary": true},
    {"name": "NVIDIA", "feed": "https://blogs.nvidia.com/feed/", "hosts": ["blogs.nvidia.com", "nvidianews.nvidia.com"], "group": "nvidia", "primary": true},
]
export const SOURCE_POLICY_VERSION="three-source-topics-v2"
export function hasRequiredSources(refs=[]) {
    if(!Array.isArray(refs))return false
    const verified=refs.map(ref=>{const source=SOURCES.find(s=>s.name===ref.name);return source&&safeUrl(ref.url,source)?source:null})
    if(verified.some(s=>!s))return false
    return new Set(verified.map(s=>s.name)).size>=3 && new Set(verified.filter(s=>!s.primary).map(s=>s.group||s.name)).size>=2
}
export const hash = value => createHash("sha256").update(value).digest("hex")
export const words = value => String(value || "").trim().split(/\s+/).filter(Boolean)
export function clean(value) {
    return String(value || "").replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|quot|apos|lt|gt);/g, entity => ({ "&nbsp;": " ", "&amp;": "&", "&quot;": '"', "&apos;": "'", "&lt;": "<", "&gt;": ">" })[entity]).replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim()
}
// Preserve the intentional paragraph boundary while normalizing each paragraph.
export function cleanDetail(value) {
    return String(value || "").trim().split(/\r?\n\s*\r?\n/).map(clean).filter(Boolean).join("\n\n")
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
    const filtered=items.filter(item => {
        const age = now - Date.parse(item.publishedAt)
        if (!Number.isFinite(age) || age < -5 * 60 * 1000 || age > 36 * 60 * 60 * 1000 || words(item.text).length < 12) return false
        if (!/\b(ai|artificial intelligence|software|tech|cyber|security|chip|computer|apple|google|microsoft|meta|openai|anthropic|samsung|phone|gadget|data|robot|internet|app|nvidia)\b/i.test(item.title + " " + item.text)) return false
        if (/\b(deals?|coupons?|discount|sponsored|horoscope|wordle|crossword|promo codes?|black friday|on sale|new low prices|buying guide)\b/i.test(item.title)) return false
        if (seen.has(item.url)) return false
        seen.add(item.url)
        return true
    }).sort((a,b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt))
    // Round-robin publishers so prolific feeds cannot crowd out specialist or primary evidence.
    const groups=[...new Set(filtered.map(i=>i.source))].map(name=>filtered.filter(i=>i.source===name).slice(0,8))
    return Array.from({length:8},(_,i)=>groups.flatMap(g=>g[i]?[g[i]]:[])).flat().slice(0,112)
}
// Group corroborating coverage before generation. A writer never receives unrelated events.
export function evidenceTopics(items) {
    const stop=new Set("the and for with from that this has are its new says say after over into amid how what why now gets is of to a an at in on as by but not it too did didnt can could more they us ai apple google openai nvidia microsoft technology tech".split(" "))
    const tokens=title=>new Set((title.toLowerCase().match(/[a-z0-9]+/g)||[]).filter(w=>w.length>2&&!stop.has(w)).map(w=>["sued","sues","lawsuit","suing"].includes(w)?"sue":w==="facial"?"face":["reinstatement","reinstate","back","return"].includes(w)?"return":w.replace(/s$/, "")))
    const sets=items.map(i=>tokens(i.title)), frequency=new Map()
    sets.forEach(set=>set.forEach(t=>frequency.set(t,(frequency.get(t)||0)+1)))
    const weight=t=>Math.log(1+items.length/frequency.get(t))**2
    function related(a,b){const common=[...a].filter(t=>b.has(t));return common.length>=2&&common.reduce((sum,t)=>sum+weight(t),0)/Math.max(1,Math.sqrt([...a].reduce((sum,t)=>sum+weight(t),0)*[...b].reduce((sum,t)=>sum+weight(t),0)))>=.3}
    const groups=items.map((item,index)=>({title:item.title,items:items.filter((_,other)=>other===index||related(sets[index],sets[other]))})).filter(group=>hasRequiredSources(group.items.map(i=>({name:i.source,url:i.url}))))
    groups.sort((a,b)=>new Set(b.items.map(i=>i.source)).size-new Set(a.items.map(i=>i.source)).size||Date.parse(b.items[0].publishedAt)-Date.parse(a.items[0].publishedAt))
    const selected=[]
    for(const group of groups){if(selected.some(previous=>group.items.filter(i=>previous.items.some(p=>p.url===i.url)).length>=2))continue;selected.push(group);if(selected.length===7)break}
    return selected.map((group,index)=>({...group,id:`event-${index+1}`,items:group.items.slice(0,10).map((item,i)=>({...item,id:`event-${index+1}-source-${i+1}`}))}))
}
export function validateStories(result, items, now = Date.now()) {
    if (!Array.isArray(result?.stories)) throw new Error("Invalid summary response")
    const stories = [], used = new Set()
    for (const raw of result.stories.slice(0,10)) {
        if (!raw || ![raw.headline,raw.summary,raw.detail,raw.whyItMatters].every(v=>typeof v==="string" && !/[<>]/.test(v))) continue
        const draft={...raw,...Object.fromEntries(["headline","summary","detail","whyItMatters"].map(key=>[key,key === "detail" ? cleanDetail(raw[key]) : clean(raw[key])]))}
        if (!draft || ![draft.headline,draft.summary,draft.whyItMatters].every(v => typeof v === "string" && v === clean(v) && !/[<>]/.test(v))) continue
        const refs = Array.isArray(draft.sourceIds) ? [...new Set(draft.sourceIds)].map(id=>items.find(item=>item.id===id)) : []
        // Three distinct organizations, including at least two independent publisher groups.
        if (refs.length < 3 || refs.some(ref=>!ref) || !hasRequiredSources(refs.map(ref=>({name:ref.source,url:ref.url})))) continue
        if (refs.some(ref=>used.has(ref.id))) continue
        if (words(draft.summary).length < 30 || words(draft.summary).length > 60 || words(draft.detail).length < 80 || words(draft.detail).length > 150 || words(draft.whyItMatters).length < 10 || words(draft.whyItMatters).length > 45 || draft.headline.length < 15 || draft.headline.length > 150) continue
        const paragraphs = draft.detail.split("\n\n")
        if (paragraphs.length !== 2 || paragraphs.some(p=>words(p).length < 30 || words(p).length > 90) || paragraphs[0].toLowerCase() === paragraphs[1].toLowerCase()) continue
        if (stories.some(story=>similarity(story.headline,draft.headline)>=.6)) continue
        const evidence=refs.map(ref=>ref.title+" "+ref.text).join(" ")
        if(words(evidence).length < (90))continue
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
export function signature(secret, timestamp, force=false) { return createHmac("sha256",secret).update(`trending-refresh:${timestamp}${force?":manual":""}`).digest("hex") }
export function authenticated(request, secret, now=Date.now()) {
    if (!secret) return false
    const timestamp = request.headers.get("x-trending-time") || ""
    const signed = request.headers.get("x-trending-signature") || ""
    if (!/^\d{13}$/.test(timestamp) || Math.abs(now-Number(timestamp))>60000 || !/^[a-f0-9]{64}$/.test(signed)) return false
    return timingSafeEqual(Buffer.from(signed,"hex"),Buffer.from(signature(secret,timestamp,request.headers.get("x-trending-force")==="1"),"hex"))
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
