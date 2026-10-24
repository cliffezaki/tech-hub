import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import ts from "typescript"
const source = await readFile(new URL("../lib/analytics-report.ts", import.meta.url),"utf8")
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText
const { validDate, previousPeriod, percentChange, summarize, presetRange } = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`)
assert.equal(validDate("2026-02-30"),false)
assert.equal(validDate("2024-02-29"),true)
assert.equal(validDate("bad"),false)
assert.deepEqual(previousPeriod("2024-03-01","2024-03-07"),{start:"2024-02-23",end:"2024-02-29",days:7})
const now=new Date("2026-01-01T10:00:00Z")
assert.deepEqual(presetRange("yesterday",now),{start:"2025-12-31",end:"2025-12-31"})
assert.deepEqual(presetRange("7",now),{start:"2025-12-26",end:"2026-01-01"})
assert.deepEqual(presetRange("30",now),{start:"2025-12-03",end:"2026-01-01"})
assert.deepEqual(presetRange("month",new Date("2026-10-24T08:00:00Z")),{start:"2026-10-01",end:"2026-10-24"})
assert.deepEqual(presetRange("year",new Date("2026-10-24T08:00:00Z")),{start:"2026-01-01",end:"2026-10-24"})
assert.equal(percentChange(15,10),50);assert.equal(percentChange(5,10),-50)
assert.equal(percentChange(4,0),null);assert.equal(percentChange(0,0),0)
const records=[{kind:"view",at:"2026-10-01",path:"/news/a",country:"KE",device:"Mobile"},{kind:"view",at:"2026-10-03",path:"/news/a"},{kind:"view",at:"2026-09-30",path:"/news/b"},{kind:"click",at:"2026-10-03",path:"/news/a"}]
const report=summarize(records,"2026-10-01","2026-10-03")
assert.equal(report.total,2)
assert.deepEqual(report.daily,[{name:"2026-10-01",count:1},{name:"2026-10-02",count:0},{name:"2026-10-03",count:1}])
assert.deepEqual(report.pages,[{name:"/news/a",count:2}])
assert.equal(report.countries.find(r=>r.name==="Unknown").count,1)
assert.equal(summarize(records,"2026-10-01","2026-10-03",true).clicks,1)
assert.equal(summarize(records,"2026-08-01","2026-08-02").total,0)
console.log("PASS: calendar presets, leap-year comparisons, percentages, zero baselines, date validation and real-event aggregation")
