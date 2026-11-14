const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),ts=require('typescript');
let records=null, articles=[], settings={heroArticleId:''};
const store={listArticles:async()=>structuredClone(articles),getSettings:async()=>settings};
const mocks={ 'server-only':{},'react':{cache:f=>f},'@/lib/store':{getStore:()=>store},'@/lib/platform-store':{
 platformReady:()=>true,getRecord:async()=>structuredClone(records),saveRecord:async(c,id,v)=>{assert.equal(records,null);records=structuredClone(v)},
 replaceRecord:async(c,id,old,next)=>{assert.equal(old.recordVersion,records.recordVersion);records={...structuredClone(next),recordVersion:(old.recordVersion||0)+1};return records}
}};
const cache={};function load(name){if(mocks[name])return mocks[name];const file=path.resolve(name.startsWith('@/')?name.slice(2)+'.ts':name);if(cache[file])return cache[file].exports;const mod={exports:{}};cache[file]=mod;const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext('(function(require,module,exports){'+js+'\n})',{filename:file})(s=>s.startsWith('@/')||mocks[s]?load(s):require(s),mod,mod.exports);return mod.exports}
const placements=load('@/lib/placement-store'), shared=load('@/lib/placements'),content=load('@/lib/content'),news=load('@/lib/news-layout');
function article(id,date,extra={}){return {id,title:id,slug:id,category:'News',section:'news',publishedAt:date,status:'published',featured:false,content:'story',excerpt:'summary',author:'Tech Hub',readTime:'2 min read',...extra}}
async function save(id,body){const a=articles.find(a=>a.id===id);let plan=await placements.preparePlacements(id,body,a.section);if(plan?.conflict)return plan;Object.assign(a,body);await placements.commitPlacements(plan,a);return plan}
(async()=>{
 articles=[article('old','2026-10-01',{pinnedAreas:['homepage']}),article('current','2026-10-02',{pinnedAreas:['homepage']})];
 const migrated=await placements.readPlacements();assert.deepEqual(Array.from(migrated.pins.current),['homepage']);assert.deepEqual(Array.from(migrated.pins.old),['homepage:featured']);assert.equal(migrated.previousLead,'old');
 articles=[article('a','2026-11-01',{pinnedAreas:['homepage','News'],featured:true}),article('b','2026-11-02'),article('c','2026-11-03')];
 let state=await placements.readPlacements();assert.deepEqual(Array.from(state.pins.a),['homepage','news:latest','homepage:featured']);
 let p=await save('b',{pinnedAreas:['homepage'],featured:false});assert.ok(p.conflict);assert.equal(records,null);
 await save('b',{pinnedAreas:['homepage'],featured:false,confirmPlacements:p.conflict.confirmPlacements});
 assert.ok(records.pins.b.includes('homepage'));assert.ok(!records.pins.a.includes('homepage'));assert.equal(records.previousLead,'a');
 let home=await content.getHomepageContent();assert.equal(home.lead.id,'b');assert.equal(home.secondary[0].id,'a');
 await save('c',{pinnedAreas:['homepage:also'],featured:false});
 p=await save('a',{pinnedAreas:['homepage'],featured:false});await save('a',{pinnedAreas:['homepage'],featured:false,confirmPlacements:p.conflict.confirmPlacements});
 home=await content.getHomepageContent();assert.equal(home.lead.id,'a');assert.equal(home.secondary[0].id,'c');assert.equal(records.previousLead,'b');
 await save('c',{pinnedAreas:[],featured:false});home=await content.getHomepageContent();assert.equal(home.secondary[0].id,'b');
 await save('a',{pinnedAreas:[],featured:false});home=await content.getHomepageContent();assert.equal(home.lead.id,'c');assert.equal(home.secondary[0].id,'a');
 // A fresh publication automatically rotates the previously selected automatic lead.
 articles.push(article('d','2026-11-04'));await save('d',{status:'published',pinnedAreas:[],featured:false});
 // For creation the plan is captured before the new article exists, tested separately below.
 assert.equal((await content.getHomepageContent()).lead.id,'d');
 await save('b',{pinnedAreas:['news:latest'],featured:false});const list=await content.getSectionArticles('news');assert.equal(list[0].id,'b');
 const layout=news.newsLayout(list);assert.equal(layout.feed[0].id,'b');assert.equal(new Set([layout.hero?.id,...layout.headlines.map(a=>a.id),...layout.feed.map(a=>a.id)].filter(Boolean)).size,list.length);
 articles.push(article('future','2099-01-01',{status:'draft',scheduledAt:'2099-01-01',pinnedAreas:['homepage']}));articles.push(article('draft','2026-11-05',{status:'draft'}));home=await content.getHomepageContent();assert.notEqual(home.lead.id,'future');assert.ok(!home.featured.some(a=>a.id==='draft'));
 // The same story cannot occupy both singleton placements.
 await save('b',{pinnedAreas:['homepage','homepage:also'],featured:false});
 const check=await placements.readPlacements();assert.ok(!check.pins.b.includes('homepage:also'));
 // Stale confirmation must not silently replace a changed occupant.
 let pending=await save('a',{pinnedAreas:['homepage'],featured:false});assert.ok(pending.conflict);
 const stale=pending.conflict.confirmPlacements;
 let change=await save('c',{pinnedAreas:['homepage'],featured:false});await save('c',{pinnedAreas:['homepage'],featured:false,confirmPlacements:change.conflict.confirmPlacements});
 pending=await save('a',{pinnedAreas:['homepage'],featured:false,confirmPlacements:stale});assert.ok(pending.conflict);
 // Actual new-article path captures the outgoing lead before creation.
 const plan=await placements.preparePlacements('new',{status:'published',pinnedAreas:[]},'news');const created=article('newest','2026-11-06');articles.push(created);plan.next.pins.newest=plan.next.pins.new;delete plan.next.pins.new;await placements.commitPlacements(plan,created);
 assert.equal(records.lastLead,'c'); // an explicit highlight still wins
 assert.deepEqual(shared.pinnedFirst([article('x','2026-11-01',{pinnedAreas:['news:latest']}),article('y','2026-11-02')],'news:latest').map(a=>a.id),['x','y']);
 console.log('Placement tests passed: migration, replacement/confirmation, rotation, manual priority/unpinning, ordering, visibility, deduplication and stale confirmation.');
})().catch(e=>{console.error(e);process.exit(1)});
