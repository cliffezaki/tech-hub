import assert from "node:assert/strict"
import vm from "node:vm"
import { readFile } from "node:fs/promises"
import ts from "typescript"
const exports = {}, sections = ["news","reviews","how-to","how-stuff-works","tech-kenya"]
vm.runInNewContext(ts.transpileModule(await readFile("lib/menu-layout.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{exports, require: () => ({ARTICLE_SECTIONS:sections, SECTION_META:Object.fromEntries(sections.map(s=>[s,{navLabel:s,label:s}]))})})
const {resolveLayout,movePage,moveLink,publicItems,localPath,pinned} = exports
const pages = [...sections,"about","advertise","contact","privacy"].map(slug => ({id:slug,slug,title:slug,status:slug === "privacy" ? "draft":"published"}))
const layout = resolveLayout(pages,null)
assert.equal(layout.items.filter(i=>i.menu==="main").length,9)
assert.deepEqual(Array.from(layout.items.filter(i=>i.menu==="footer").map(i=>i.href)),["/about","/advertise","/contact","/search","/account"])
const moved = movePage(layout,"reviews",-1)
for(const menu of ["main","sections"]) assert.deepEqual(Array.from(moved.items.filter(i=>i.menu===menu && ["/news","/reviews"].includes(i.href)).map(i=>i.href)),["/reviews","/news"])
assert.equal(moved.items.find(i=>i.id==="main-home").href,"/")
const footerMoved = moveLink(layout,"footer-advertise",-1)
assert.equal(footerMoved.items.filter(i=>i.menu==="footer")[0].href,"/advertise")
assert.throws(()=>moveLink(layout,"footer-account",-1))
assert.throws(()=>movePage(layout,"news",-1))
for(const path of ["//evil.example","/\\evil.example","/%2f%2fevil.example","/admin","/api/users","javascript:alert(1)"]) assert.throws(()=>localPath(path))
assert.equal(localPath("/about"),"/about")
const custom = {...layout,revision:"saved",items:layout.items.map(i=>i.id==="main-about"?{...i,menu:"footer",href:"/custom",name:"Custom"}:i)}
const restored = resolveLayout(pages,custom)
assert.equal(restored.items.filter(i=>i.id==="main-about").length,1)
assert.equal(restored.items.find(i=>i.id==="main-about").href,"/custom")
const draft = {...layout,items:[...layout.items,{id:"private-test",menu:"main",name:"Privacy",href:"/privacy"}]}
assert.ok(!publicItems(draft,pages).some(i=>i.id==="private-test"))
assert.equal(restored.items.filter(pinned).at(-1).href,"/account")
console.log("PASS: built-in menus, persistent page/menu ordering, draft filtering, fixed account links, custom-link preservation, and safe local paths.")
