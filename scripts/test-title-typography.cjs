/* eslint-disable @typescript-eslint/no-require-imports -- TypeScript test harness. */
const ts=require('typescript'),fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
function load(file){const loaded={exports:{}};const code=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;vm.runInThisContext('(function(require,module,exports){'+code+'\n})')(name=>load(name.replace('@/','')+'.ts'),loaded,loaded.exports);return loaded.exports}
const {parseTitleTypography,titleVariables,headlineStyle,headlineVariables}=load('lib/title-typography.ts');
const first={lead:{font:'Lora',size:38},more:{font:'Inter',size:22}};
assert.deepEqual(parseTitleTypography(JSON.stringify(first)),Object.fromEntries(Object.entries(first).map(([key,value])=>[key,{...value,bold:true,italic:false,useArticleStyles:true}])));
assert.equal(titleVariables(JSON.stringify(first))['--title-reviews-size'],'20px');
assert.equal(titleVariables(JSON.stringify(first))['--title-lead-font'],'Lora');
assert.deepEqual(parseTitleTypography('{"lead":{"font":"url(evil)","size":38},"more":{"font":"Inter","size":200}}'),{});
assert.deepEqual(parseTitleTypography('invalid'),{});
assert.equal(headlineStyle('Lora','38px').fontFamily,'Lora');assert.equal(headlineStyle('evil','999px').fontSize,undefined);
const fields=load('lib/editor-fields.ts').editorFields;
assert.equal(fields({titleFont:'Lora',titleSize:'38px'}).titleSize,'38px');
assert.throws(()=>fields({titleSize:'999px'}));assert.throws(()=>fields({titleFont:'evil'}));
console.log('PASS: independent section styles, safe defaults, validation and headline persistence fields.');

const styled={lead:{font:'Lora',size:40,bold:false,italic:true,useArticleStyles:false},more:{font:'Inter',size:22,bold:true,italic:false,useArticleStyles:true}};
assert.deepEqual(parseTitleTypography(JSON.stringify(styled)),styled);
const vars=titleVariables(JSON.stringify(styled));assert.equal(vars['--title-lead-forced-font'],'Lora');assert.equal(vars['--title-more-forced-font'],'initial');assert.equal(vars['--title-lead-weight'],'400');assert.equal(vars['--title-lead-style'],'italic');
assert.equal(headlineVariables({titleFont:'Lora',titleBold:false,titleItalic:true,titleSize:'48px'})['--article-title-weight'],'400');
assert.equal(headlineStyle('Lora','48px',false,true).fontStyle,'italic');
assert.equal(fields({titleBold:false,titleItalic:true}).titleBold,false);assert.throws(()=>fields({titleBold:'false'}));
console.log('PASS: bold/italic persistence, article precedence and explicit per-section override.');
