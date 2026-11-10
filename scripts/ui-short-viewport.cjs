// Read-only production DOM/CSS regression. No kernel, AI, or clipboard output.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const esbuild=require('esbuild'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
const OUT=process.env.XLC_UI_OUTPUT;
if(!OUT||!path.isAbsolute(OUT))throw Error('XLC_UI_OUTPUT must be an external absolute output directory');
fs.mkdirSync(OUT,{recursive:true});
esbuild.buildSync({entryPoints:[path.join(ROOT,'scripts/harness/entry.ts')],outfile:path.join(OUT,'bundle.js'),bundle:true,platform:'browser',format:'iife',alias:{siyuan:path.join(ROOT,'scripts/harness/stub-dom.cjs')},logLevel:'warning'});
const css=fs.readFileSync(process.env.XLC_UI_CSS||path.join(ROOT,'dist/index.css'),'utf8');
const render=fs.readFileSync(path.join(ROOT,'scripts/debug-surface-sweep.cjs'),'utf8');
const vars=render.match(/const b3Vars = `([\s\S]*?)`;/)[1];
fs.writeFileSync(path.join(OUT,'index.html'),`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${vars}html,body{margin:0;color:var(--b3-theme-on-background)}.b3-dialog__container{max-width:100vw;max-height:100dvh}</style><style>${css}</style><div class="b3-scope light" id="stage"></div><script src="bundle.js"></script>`);
const visibleField=()=>{const el=document.querySelector('.xlc-varform-fields');const input=el.querySelector('input');const r=input.getBoundingClientRect();return {height:el.clientHeight,firstY:r.y,firstBottom:r.bottom,viewport:innerHeight}};
(async()=>{const browser=await chromium.launch({channel:'chrome'}),results=[];try{
for(const [width,height]of[[568,320],[390,320],[640,450],[390,844]]){
const page=await browser.newPage({viewport:{width,height},hasTouch:true});await page.route(/^https?:/,r=>r.abort());await page.goto('file:///'+path.join(OUT,'index.html').replace(/\\/g,'/'));await page.waitForFunction(()=>!!window.XlcHarness);await page.evaluate(()=>window.XlcHarness.openSurface('varForm'));await page.waitForSelector('.xlc-varform-fields');await page.evaluate(()=>Promise.allSettled(document.getAnimations().filter(a=>a.effect?.getTiming().iterations!==Infinity).map(a=>a.finished)));
const before=await page.evaluate(visibleField);assert.ok(before.height>=100,`input region compressed: ${JSON.stringify({width,height,...before})}`);assert.ok(before.firstY>=0&&before.firstBottom<=height,'first input must be visible on entry');
for(const el of await page.locator('.xlc-varform-fields input,.xlc-varform-fields textarea,[aria-label="预设方案选择"]').all()){
await el.scrollIntoViewIfNeeded();await el.focus();await el.click({timeout:2000});const hit=await el.evaluate(e=>{const r=e.getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h===e||e.contains(h)});assert.equal(hit,true,'focused field/preset must receive pointer input');}
if(height<=450){const bad=await page.addStyleTag({content:'.xlc-varform-fields{height:4px!important;min-height:0!important;max-height:4px!important;overflow:hidden!important}'});const invalid=await page.evaluate(visibleField);assert.throws(()=>assert.ok(invalid.height>=100));await bad.evaluate(el=>el.remove());assert.ok((await page.evaluate(visibleField)).height>=100);}
await page.screenshot({path:path.join(OUT,`variables-${width}x${height}.png`)});results.push({width,height,...before,pass:true});await page.close();}
const page=await browser.newPage({viewport:{width:390,height:844}});await page.goto('file:///'+path.join(OUT,'index.html').replace(/\\/g,'/'));await page.waitForFunction(()=>!!window.XlcHarness);await page.evaluate(()=>window.XlcHarness.openSurface('guide'));await page.waitForSelector('.xlc-guide-kbd');const help=await page.locator('body').innerText();assert.ok(help.includes('Alt + Shift + C')&&help.includes('Alt + Shift + M'));assert.ok(!help.includes('Alt + Space'));
await page.locator('.xlc-guide-kbd').first().evaluate(el=>el.textContent='Alt + Space');const wrongHelp=await page.locator('body').innerText();assert.throws(()=>assert.ok(wrongHelp.includes('Alt + Shift + C')&&!wrongHelp.includes('Alt + Space')));await page.locator('.xlc-guide-kbd').first().evaluate(el=>el.textContent='Alt + Shift + C');await page.screenshot({path:path.join(OUT,'guide-default-keys.png')});results.push({guideDefaults:true,oldShortcutNegativeDetected:true});await page.close();
}finally{await browser.close()}fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(results,null,2));console.log(JSON.stringify(results));})().catch(e=>{console.error(e);process.exitCode=1});
