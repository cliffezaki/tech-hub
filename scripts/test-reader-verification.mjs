import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import crypto from "node:crypto"
import ts from "typescript"
const records = new Map(), sent = []
const key = (collection, id) => `${collection}:${id}`
const digest = value => crypto.createHash("sha256").update(value).digest("hex")
const storage = {
    getRecord: async (collection, id) => structuredClone(records.get(key(collection,id)) || null),
    saveRecord: async (collection, id, value) => { records.set(key(collection,id), structuredClone(value)); return value },
    claim: async (collection, id, value) => { if (records.has(key(collection,id))) return false; records.set(key(collection,id), structuredClone(value)); return true },
    deleteRecord: async (collection,id) => records.delete(key(collection,id)),
    replaceRecord: async (collection, id, previous, value) => {
        const stored = records.get(key(collection,id))
        if (!stored || stored.recordVersion !== previous.recordVersion) throw Object.assign(Error("Record changed"), {status:409})
        const updated = {...value,recordVersion:(previous.recordVersion || 0)+1}
        records.set(key(collection,id), structuredClone(updated)); return updated
    },
    listRecords: async (collection,matches={}) => [...records].filter(([k,v]) => k.startsWith(`${collection}:`) && Object.entries(matches).every(([f,value]) => v[f]===value)).map(([,v])=>structuredClone(v)),
}
async function load(file, imports) {
    const exports = {}
    vm.runInNewContext(ts.transpileModule(await readFile(file,"utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText, {
        exports, Buffer, URL, Request, Date, Uint8Array, structuredClone, console:{error(){}}, process:{env:{NEXT_PUBLIC_SITE_URL:"https://example.test"}},
        require(name){if(name==="server-only")return {}; if(name in imports)return imports[name]; throw Error(name)},
    })
    return exports
}
const security = await load("lib/request-security.ts",{})
assert(security.originMatches("https://example.test","example.test"))
for(const origin of [null,"null","https://example.test.evil.test","https://example.test/","http://[","https://user@example.test"])assert.equal(security.originMatches(origin,"example.test"),false)
const req = (body, type="application/json") => new Request("https://example.test/api/reader",{method:"POST",headers:{"Content-Type":type},body:JSON.stringify(body)})
await assert.rejects(security.readJson(req({data:"x".repeat(25000)})),e=>e.status===413)
await assert.rejects(security.readJson(req([],"application/json")),e=>e.status===400)
await assert.rejects(security.readJson(req({},"text/plain")),e=>e.status===415)
assert.equal((await security.readJson(req({action:"test"}))).action,"test")
const mail = {verifyEmailDelivery:async()=>{},sendVerificationEmail:async(...args)=>sent.push(args),sendNewsletterVerification:async(...args)=>sent.push(args)}
const imports = {"node:crypto":crypto,"@/lib/accounts":{emailId:digest},"@/lib/platform-store":storage,"@/lib/email":mail,"@/lib/password-reset":{resetConfigured:()=>true}}
const verification = await load("lib/email-verification.ts",imports)
const user = {id:digest("reader@example.test"),email:"reader@example.test",role:"reader",passwordHash:"test-private-hash",sessionVersion:1}
await verification.requestVerification(user)
assert.equal(sent.length,1)
assert.equal(await storage.getRecord("users",user.id),null)
const token = sent[0][1].hash.slice("#verify=".length)
assert.match(token,/^[a-f0-9]{64}$/)
assert(!JSON.stringify([...records]).includes(token))
await verification.verifyAccount(token)
assert.equal((await storage.getRecord("users",user.id)).role,"reader")
assert((await storage.getRecord("users",user.id)).emailVerifiedAt)
await assert.rejects(verification.verifyAccount(token))
await verification.requestVerification({...user,role:"owner"})
assert.equal(sent.length,1)
assert.equal((await storage.getRecord("users",user.id)).role,"reader")
const other = {...user,id:digest("other@example.test"),email:"other@example.test"}
await verification.requestVerification(other)
const expiredToken=sent.at(-1)[1].hash.slice("#verify=".length)
records.get(key("pending-accounts",digest(expiredToken))).expiresAt=0
await assert.rejects(verification.verifyAccount(expiredToken))
assert.equal(await storage.getRecord("users",other.id),null)
const newsletter = await load("lib/newsletter-verification.ts",imports)
const email="newsletter@example.test",id=digest(email)
await newsletter.requestNewsletter(email)
const newsToken=sent.at(-1)[1].hash.slice("#newsletter=".length)
assert.equal(await storage.getRecord("subscriptions",id),null)
await newsletter.verifyNewsletter(newsToken)
assert.equal((await storage.getRecord("subscriptions",id)).active,true)
let subscription = await storage.getRecord("subscriptions",id)
await storage.replaceRecord("subscriptions",id,subscription,{...subscription,active:false})
await newsletter.requestNewsletter(email)
const stale=sent.at(-1)[1].hash.slice("#newsletter=".length)
subscription = await storage.getRecord("subscriptions",id)
await storage.replaceRecord("subscriptions",id,subscription,{...subscription,active:false})
await assert.rejects(newsletter.verifyNewsletter(stale),/changed/)
assert.equal((await storage.getRecord("subscriptions",id)).active,false)
const state = await load("lib/reader-state.ts",{"@/lib/platform-store":storage})
let actor = {id:"alice",name:"Alice",email:"alice@example.test"},sameOrigin=true
const reader = await load("app/api/reader/route.ts",{
    "next/server":{NextResponse:{json:(data,init={})=>({data,status:init.status||200,headers:init.headers})}},
    "@/lib/accounts":{currentUser:async()=>actor,sameOrigin:async()=>sameOrigin,throttle:async()=>true},
    "@/lib/request-security":security,"@/lib/content":{getAllArticleSummaries:async()=>[{id:"public-story",category:"Security",tags:["Privacy"]}]},
    "@/lib/platform-store":storage,"@/lib/reader-state":state,
})
assert.equal((await reader.GET(new Request("https://example.test/api/reader"))).data.state.historyEnabled,false)
await reader.POST(req({action:"history",articleId:"public-story"}))
assert.equal((await state.readReaderState("alice")).history.length,0)
assert.equal((await reader.POST(req({action:"bookmark",articleId:"draft-story",saved:true}))).status,404)
await reader.POST(req({action:"bookmark",articleId:"public-story",saved:true,userId:"bob"}))
assert.equal((await state.readReaderState("alice")).bookmarks.length,1)
assert.equal((await state.readReaderState("bob")).bookmarks.length,0)
await reader.POST(req({action:"preferences",historyEnabled:true,topics:["Privacy","Made-up topic"]}))
await reader.POST(req({action:"history",articleId:"public-story"}))
assert.equal((await state.readReaderState("alice")).history.length,1)
assert.equal((await state.readReaderState("alice")).topics.length,1)
await reader.POST(req({action:"preferences",historyEnabled:false}))
assert.equal((await state.readReaderState("alice")).history.length,0)
sameOrigin=false;assert.equal((await reader.POST(req({action:"clear-history"}))).status,403);sameOrigin=true
actor=null;assert.equal((await reader.GET(new Request("https://example.test/api/reader"))).status,401)
assert.equal((await reader.POST(req({action:"clear-history"}))).status,401)
console.log("PASS: bounded JSON/origin checks, hashed and expiring verification tokens, no pre-verification accounts, token replay, existing-user protection, confirmed newsletter consent, stale unsubscribe protection, reader isolation, published-only bookmarks, opt-in history and clearing. No network or mail used.")
