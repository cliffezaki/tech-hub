import assert from "node:assert/strict"
import { SOURCES, candidates, validateStories, signature, authenticated, MAX_AGE, mergeStories } from "../lib/trending-core.mjs"
import { parseFeed, refreshFeed } from "../lib/trending-worker.mjs"

const now=Date.parse("2026-11-14T08:00:00Z")
const description="A technology company has released new software for developers. The system helps teams find errors in applications and includes controls designed to protect information while they work on shared projects."
const xml=`<rss><channel><item><title>Software update for developers</title><link>https://www.bbc.com/news/example?utm_source=test</link><pubDate>${new Date(now).toUTCString()}</pubDate><description><![CDATA[<p>${description}</p>]]></description></item></channel></rss>`
const parsed=parseFeed(xml,SOURCES[0])
assert.equal(parsed.length,1)
assert.equal(parsed[0].url,"https://www.bbc.com/news/example")
assert.equal(parsed[0].text,description)
assert.equal(parseFeed(xml.replace("https://www.bbc.com/news/example","https://evil.example/story"),SOURCES[0]).length,0)
assert.throws(()=>parseFeed('<!DOCTYPE rss [<!ENTITY x SYSTEM "file:///etc/passwd">]><rss/>',SOURCES[0]))
const atom=`<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Software update</title><link href="https://www.theverge.com/example"/><published>${new Date(now).toISOString()}</published><updated>${new Date(now+1000).toISOString()}</updated><summary>${description}</summary></entry></feed>`
assert.equal(parseFeed(atom,SOURCES[1])[0].publishedAt,new Date(now).toISOString())
assert.equal(candidates([...parsed,...parsed],now).length,1)
assert.equal(candidates(parsed,now+MAX_AGE).length,0)
assert.equal(candidates([{...parsed[0],title:"Best phone deals and coupons"}],now).length,0)
const items=[...parsed,{...parsed[0],id:"second",source:"The Verge",url:"https://www.theverge.com/example"}]
const draft={headline:"Developer software adds safeguards for shared projects",summary:"Developers have a new software release intended to help them spot application errors. It also includes information protection controls for teams working together, combining debugging assistance with safeguards for shared development projects.",detail:"A newly released developer tool brings error detection and information protection into the same workflow. The software is aimed at teams collaborating on applications, with controls for handling the information involved in that work. The available reporting describes both debugging support and safeguards for shared projects, rather than a tool focused solely on finding errors.",whyItMatters:"Teams working on shared applications need to locate errors while protecting the information involved in their projects.",sourceIds:items.map(i=>i.id)}
assert.equal(validateStories({stories:[draft]},items,now).length,1)
assert.equal(validateStories({stories:[{...draft,sourceIds:[items[0].id]}]},items,now).length,0)
assert.equal(validateStories({stories:[{...draft,headline:"Software protects 500 million developer accounts"}]},items,now).length,0)
assert.equal(validateStories({stories:[draft,draft]},items,now).length,1)
assert.equal(validateStories({stories:[{...draft,summary:description}]},items,now).length,0)
const single=[{...items[0],text:description+" "+description+" "+description}]
assert.equal(validateStories({stories:[{...draft,sourceIds:[single[0].id]}]},single,now).length,0)
assert.equal(validateStories({stories:[{...draft,summary:"According to BBC Technology, "+draft.summary,sourceIds:[single[0].id]}]},single,now).length,1)
assert.equal(validateStories({stories:[{...draft,detail:draft.detail.replace(". The",".\n\nThe")}]},items,now).length,1)
const signed=new Request("https://example.com",{headers:{"x-trending-time":String(now),"x-trending-signature":signature("test",String(now))}})
assert.equal(authenticated(signed,"test",now),true)
assert.equal(authenticated(signed,"wrong",now),false)
assert.equal(authenticated(signed,"test",now+61000),false)
assert.deepEqual(await refreshFeed({},()=>{throw Error("must not fetch")},now),{status:"not-configured"})

// Exercise real orchestration with mocked provider/storage boundaries.
let records=new Map(), calls=0, mode="success"
const env={OPENAI_API_KEY:"test",TRENDING_AI_MODEL:"test-model",SUPABASE_URL:"https://example.supabase.co",SUPABASE_SECRET_KEY:"test"}
async function mock(url,init={}) {
    url=new URL(url)
    if(url.hostname==="example.supabase.co") {
        const id=url.searchParams.get("id")?.replace("eq.","")
        if(!init.method)return Response.json(records.has(id)?[{payload:records.get(id)}]:[])
        const body=JSON.parse(init.body)
        if(init.method==="POST"){
            if(!init.headers.Prefer?.includes("ignore-duplicates")||!records.has(body.id))records.set(body.id,body.payload)
            return new Response(null,{status:201})
        }
        const previous=records.get(id), condition=url.searchParams.get("payload->>until")
        const [op,val]=condition.split(".")
        if(op==="lt"?previous.until<Number(val):previous.until===Number(val)){records.set(id,body.payload);return Response.json([{id}])}
        return Response.json([])
    }
    if(url.hostname==="api.openai.com") {
        calls++
        if(mode==="failure")return new Response("unavailable",{status:503})
        const input=JSON.parse(JSON.parse(init.body).messages[1].content)
        const answer=input.drafts?{approvedIds:input.drafts.map(s=>s.id)}:{stories:[{...draft,sourceIds:input.items.slice(0,2).map(i=>i.id)}]}
        return Response.json({choices:[{finish_reason:"stop",message:{content:JSON.stringify(answer)}}]})
    }
    if(url.hostname==="feeds.bbci.co.uk")return new Response(xml)
    if(url.hostname==="www.theverge.com")return new Response(atom)
    return new Response("offline",{status:503})
}
assert.equal((await refreshFeed(env,mock,now)).status,"updated")
assert.equal(calls,3)
const saved=records.get("feed")
assert.equal(saved.stories.length,1)
assert.equal((await refreshFeed(env,mock,now+1000)).status,"rate-limited")
assert.equal(calls,3)
assert.equal((await refreshFeed(env,mock,now+2*60*60*1000)).status,"unchanged")
assert.equal(calls,3)
records.delete("processed");mode="failure"
await assert.rejects(()=>refreshFeed(env,mock,now+4*60*60*1000))
assert.deepEqual(records.get("feed"),saved)
assert.equal(records.get("lock").until,0)
assert.equal(records.get("attempt").status,"failed")
console.log("Trending tests passed: parsing, source validation, freshness, deduplication, grounding, copyright guard, authentication, budget, cache and failure preservation.")

const sample=(i)=>({...saved.stories[0],id:String(i),headline:String.fromCharCode(97+i).repeat(24),sources:[{name:'The Verge',url:'https://www.theverge.com/'+i}],publishedAt:new Date(now+i*1000).toISOString(),expiresAt:new Date(now+MAX_AGE).toISOString()})
const rolling=mergeStories(Array.from({length:7},(_,i)=>sample(i)),[sample(7)],now)
assert.equal(rolling.length,7)
assert.equal(rolling[0].id,'7')
assert.equal(rolling.some(s=>s.id==='0'),false)
const update={...sample(4),id:'updated-id',headline:'Updated coverage of this development'}
const revised=mergeStories(rolling,[update],now)
assert.equal(revised.length,7)
assert.equal(revised.find(s=>s.id==='4').headline,update.headline)
assert.equal(mergeStories(rolling,[],now+MAX_AGE+1).length,0)
console.log('Rolling feed passed: newest first, seven-item cap, oldest replacement, source-based updates and expiry.')
