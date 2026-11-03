import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import ts from 'typescript'
const values=[]; let cursor=0, focused=false
const React={useState(initial){const i=cursor++; if(!(i in values))values[i]=initial;return [values[i],next=>values[i]=typeof next==='function'?next(values[i]):next]},useRef(){return {current:{focus(){focused=true}}}}}
const jsx=(type,props)=>({type,props})
const exports={}
const imports={'react':React,'react/jsx-runtime':{jsx,jsxs:jsx},'@/components/article-card':{ArticleCard:'Card'},'@/components/article-row':{ArticleRow:'Row'},'@/components/section-heading':{SectionHeading:'Heading'}}
vm.runInNewContext(ts.transpileModule(await readFile('components/review-collection.tsx','utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText,{exports,require:n=>{if(!(n in imports))throw Error(n);return imports[n]}})
const articles=Array.from({length:11},(_,i)=>({id:String(i),category:i%2?'Phones':'Laptops'}))
const render=()=>{cursor=0;return exports.ReviewCollection({articles})}
const walk=node=>Array.isArray(node)?node.flatMap(walk):node&&typeof node==='object'?[node,...walk(node.props?.children)]:[]
function inspect(tree,cardCount,total){const nodes=walk(tree),cards=nodes.filter(n=>n.type==='Card'),rows=nodes.filter(n=>n.type==='Row');assert.equal(cards.length,cardCount);assert.equal(cards.length+rows.length,total);assert.equal(new Set([...cards,...rows].map(n=>n.props.article.id)).size,total);return nodes}
let nodes=inspect(render(),4,11)
nodes.find(n=>n.type==='button'&&n.props.children==='Show More').props.onClick();nodes=inspect(render(),8,11)
nodes.find(n=>n.type==='button'&&n.props.children==='Show More').props.onClick();nodes=inspect(render(),11,11)
assert(!nodes.some(n=>n.type==='button'&&n.props.children==='Show More'))
nodes.find(n=>n.type==='button'&&n.props.children==='Show Less').props.onClick();nodes=inspect(render(),4,11);assert(focused)
nodes.find(n=>n.type==='select').props.onChange({target:{value:'Phones'}});nodes=inspect(render(),4,5)
nodes.find(n=>n.type==='button'&&n.props.children==='Show More').props.onClick();inspect(render(),5,5)
console.log('PASS: four initial review cards, progressive expansion, Show Less focus, category reset, and disjoint cards/list throughout. Component logic test; browser layout remains a separate check.')
