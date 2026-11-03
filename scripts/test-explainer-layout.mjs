import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
function load(file, imports, globals={}) {
    const exports={}
    return readFile(file,'utf8').then(source=>{
        vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,...globals,require:n=>{if(!(n in imports))throw Error(n);return imports[n]}})
        return exports
    })
}
const layout=await load('lib/explainer-layout.ts',{})
const make=n=>Array.from({length:n},(_,i)=>({id:String(i),section:'how-stuff-works',category:i%2?'Security':'Internet',imageUrl:'/image.png',href:`/how-stuff-works/story-${i}`,title:`Story ${i}`,featured:i===2}))
for(let n=0;n<35;n++){
    const input=make(n), result=layout.explainerLayout([...input,...input,{id:'howto',section:'how-to',category:'Internet'},{id:'hidden',section:'how-stuff-works',category:'How To'}])
    const all=[result.hero,...result.explore,...result.cards,...result.collections.flatMap(g=>g.articles)].filter(Boolean)
    assert.equal(all.length,n)
    assert.equal(new Set(all.map(a=>a.id)).size,n)
    assert(result.collections.every(g=>g.articles.length>=2))
    if(n>=5)assert(result.cards.length>=4)
    if(n>2)assert.equal(result.hero.id,'2')
}
const states=[];let cursor=0, focused=false
const jsx=(type,props)=>({type,props})
const React={useState(init){const i=cursor++;if(!(i in states))states[i]=init;return [states[i],v=>states[i]=v]},useRef(){return {current:{querySelectorAll(){return Array.from({length:50},()=>({focus(){focused=true}}))}}}}}
const component=await load('components/explainer-collection.tsx',{'react':React,'react/jsx-runtime':{jsx,jsxs:jsx},'next/link':{default:'Link'},'@/components/article-card':{ArticleCard:'Card'},'@/components/editorial-hero':{EditorialHero:'Hero'},'@/components/section-heading':{SectionHeading:'Heading'},'@/lib/explainer-layout':layout},{requestAnimationFrame:fn=>fn()})
const walk=n=>Array.isArray(n)?n.flatMap(walk):n&&typeof n==='object'?[n,...walk(n.props?.children)]:[]
const render=()=>{cursor=0;return walk(component.ExplainerCollection({articles:make(25)}))}
let nodes=render(),count=nodes.filter(n=>n.type==='Card').length
assert.equal(count,4)
while(nodes.some(n=>n.type==='button')){
    nodes.find(n=>n.type==='button').props.onClick()
    nodes=render()
    const next=nodes.filter(n=>n.type==='Card').length
    assert(next>count&&next<=count+4);count=next
}
assert.equal(count,layout.explainerLayout(make(25)).cards.length);assert(focused)
const fields=await load('lib/editor-fields.ts',{'@/lib/rich-content':{validateBody:v=>v}})
assert.equal(fields.editorFields({}).quickFacts,undefined)
assert.deepEqual(Array.from(fields.editorFields({quickFacts:[' A ','A','','B',''].slice(0,4)}).quickFacts),['A','B'])
for(const bad of ['text',[5],Array(5).fill('a'),['x'.repeat(241)]])assert.throws(()=>fields.editorFields({quickFacts:bad}))
console.log('PASS: sparse and full collections, disjoint stories, How To exclusion, featured selection, Show More batches/focus, and Quick Facts input validation.')
