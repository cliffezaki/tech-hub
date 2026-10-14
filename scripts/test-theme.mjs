import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import vm from "node:vm"
import React from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { ThemeProvider } from "next-themes"

const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8")
const tokens = (selector) => Object.fromEntries([...css.match(new RegExp(`${selector} \\{([\\s\\S]*?)\\n\\}`))[1].matchAll(/--([\w-]+):\s*([^;]+);/g)].map(m => [m[1],m[2]]))
const light = tokens(":root"), dark = {...light,...tokens("\\.dark")}
function rgb(palette, key) {
    let v = palette[key]
    while (v.startsWith("var(")) v = palette[v.slice(6,-1)]
    let [h,s,l] = v.match(/[\d.]+/g).map(Number)
    h /= 60; s /= 100; l /= 100
    const c = (1-Math.abs(2*l-1))*s, x = c*(1-Math.abs(h%2-1)), m = l-c/2
    const a = h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x]
    return a.map(n => n+m)
}
function luminance(a) { return a.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0) }
function contrast(a,b) { const x=luminance(a),y=luminance(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05) }
for (const [name,p] of [["Ivory",light],["Charcoal",dark]]) {
    for (const surface of ["background","card"]) {
        for (const text of ["foreground","muted-foreground","brand-red"]) {
            const ratio = contrast(rgb(p,text),rgb(p,surface))
            assert.ok(ratio>=4.5,`${name} ${text}/${surface}: ${ratio}`)
        }
        assert.ok(contrast(rgb(p,"input"),rgb(p,surface))>=3,`${name} input boundary`)
    }
    assert.ok(contrast(rgb(p,"brand-on-solid"),rgb(p,"brand-solid"))>=4.5)
}
const html = renderToStaticMarkup(React.createElement(ThemeProvider,{attribute:"class",defaultTheme:"system",enableSystem:true,enableColorScheme:true},React.createElement("main")))
const script = html.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
for (const [saved,systemDark,want] of [[null,false,"light"],[null,true,"dark"],["light",true,"light"],["dark",false,"dark"],["system",true,"dark"]]) {
    const classes = new Set(), style = {}
    vm.runInNewContext(script,{
        document:{documentElement:{classList:{remove:(...x)=>x.forEach(v=>classes.delete(v)),add:v=>classes.add(v)},style}},
        localStorage:{getItem:key=>{assert.equal(key,"theme");return saved}},
        window:{matchMedia:()=>({matches:systemDark})},
    })
    assert.ok(classes.has(want)); assert.equal(style.colorScheme,want)
}
assert.match(css,/prefers-reduced-motion: reduce/)
assert.match(css,/transform 250ms ease/)
const layout = await readFile(new URL("../app/layout.tsx",import.meta.url),"utf8")
assert.match(layout,/defaultTheme="system"/)
assert.doesNotMatch(layout,/disableTransitionOnChange/)
console.log("PASS: both palettes meet text/control contrast checks; pre-paint script respects saved and system themes; reduced-motion and 250ms toggle rules are present.")
