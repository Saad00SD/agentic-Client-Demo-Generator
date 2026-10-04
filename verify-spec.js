const { chromium } = require('/opt/node-tools/node_modules/playwright-core');
const fs = require('fs');
/* Usage: node verify-spec.js <path-to-VideoSpec.json>
   Drives a VideoSpec end to end against a running build: every selector in
   frame without an auto-scroll, every scroll landing where it says, the end
   state the spec declares, and the narration timing coherent. Build-agnostic
   on purpose, so every clone is checked by the same harness. */
const specPath = process.argv[2];
if (!specPath) { console.error('usage: node verify-spec.js <VideoSpec.json>'); process.exit(2); }
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
const BASE = spec.build.base;
let fail = 0;
const ok = (n,c,d)=>{ c?0:fail++; console.log(`${c?'ok  ':'FAIL'} ${n}${d!==undefined?'   '+d:''}`); };

(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const p = await b.newPage({ viewport: spec.recording.viewport });
  await p.route('**/*', r => r.request().url().startsWith(BASE.slice(0,-1)) ? r.continue() : r.abort());

  for (const sc of spec.scenes) {
    console.log(`\n— SCENE ${sc.index} · ${sc.id} · ${sc.start}s to ${sc.end}s —`);
    for (const a of sc.actions) {
      if (a.action === 'goto') {
        await p.goto(BASE + a.target, { waitUntil: spec.recording.waitUntil });
        await p.waitForTimeout(sc.settleMs || 600);
        ok(`goto ${a.target}`, true);
      }
      if (a.action === 'cursorTo' || a.action === 'click') {
        const el = p.locator(a.selector).first();
        const vis = await el.isVisible().catch(()=>false);
        const box = await el.boundingBox().catch(()=>null);
        const inFrame = box ? (box.y >= 0 && box.y + box.height <= spec.recording.viewport.height) : false;
        ok(`${a.action} ${a.selector}`, vis && inFrame,
           vis ? (inFrame ? 'in frame, no auto-scroll needed' : `OFF FRAME y=${Math.round(box.y)}`) : 'not visible');
        if (a.action === 'click') { await p.evaluate(s=>document.querySelector(s).click(), a.selector); await p.waitForTimeout(650); }
      }
      if (a.action === 'scrollTo') {
        await p.evaluate(y=>window.scrollTo(0,y), a.y);
        await p.waitForTimeout(350);
        const got = await p.evaluate(()=>Math.round(window.scrollY));
        ok(`scrollTo ${a.y}`, Math.abs(got - a.y) <= 2, `landed ${got}`);
      }
      if (a.action === 'hold' && a.anchor) {
        const el = p.locator(a.anchor).first();
        const box = await el.boundingBox().catch(()=>null);
        ok(`anchor visible ${a.anchor}`, !!box && await el.isVisible(),
           box ? `y=${Math.round(box.y)} h=${Math.round(box.height)}` : 'no box');
      }
    }
    const hash = await p.evaluate(()=>location.hash);
    const sy   = await p.evaluate(()=>Math.round(window.scrollY));
    const lang = await p.evaluate(()=>document.querySelector('[data-lang-btn].on')?.dataset.langBtn);
    console.log(`   end state: lang=${lang} scrollY=${sy} hash=${hash||'(none)'}`);
    await p.screenshot({ path:`/tmp/dry-s${sc.index}.png` });
  }

  /* End state comes from the spec's own endState string rather than being
     hardcoded to one build, so the same harness verifies every clone. */
  console.log('\n— END STATE —');
  const lastScene = spec.scenes[spec.scenes.length - 1];
  const declared = lastScene.endState || '';
  const wantHash = (declared.match(/#[^\s,]+/) || [''])[0];
  const wantScroll = (declared.match(/scroll (\d+)/) || [])[1];
  const endHash = await p.evaluate(()=>location.hash);
  const endScroll = await p.evaluate(()=>Math.round(window.scrollY));
  ok('ends where the spec says', !wantHash || endHash === wantHash, `${endHash} vs ${wantHash}`);
  ok('scroll where the spec says', wantScroll === undefined || endScroll === Number(wantScroll), `${endScroll} vs ${wantScroll}`);
  const crumbEl = await p.locator('[data-rm="rm-drill-crumb"]').count();
  if (crumbEl) {
    const crumb = (await p.locator('[data-rm="rm-drill-crumb"]').textContent()).replace(/\s+/g,' ').trim();
    const levels = await p.evaluate(()=>document.querySelectorAll('[data-rm="rm-drill-crumb"] li').length);
    ok('breadcrumb reaches the deepest level', levels === 4, `${levels} levels: ${crumb.slice(0,60)}`);
  }

  // timing coherence
  console.log('\n— TIMING —');
  const segs = spec.narration.segments;
  let overlap = 0;
  for (let i=1;i<segs.length;i++) if (segs[i].start < segs[i-1].end) overlap++;
  ok('no overlapping narration segments', overlap === 0, `${segs.length} segments`);
  const words = segs.filter(s=>!s.silence).reduce((n,s)=>n + s.text.trim().split(/\s+/).length, 0);
  const speak = segs.filter(s=>!s.silence).reduce((n,s)=>n + (s.end-s.start), 0);
  ok('narration pace 2.2 to 3.0 words per second', words/speak >= 2.2 && words/speak <= 3.0,
     `${words} words over ${speak.toFixed(1)}s = ${(words/speak).toFixed(2)} w/s`);
  const last = segs[segs.length-1].end;
  ok('lands inside target duration', Math.abs(last - spec.recording.targetDuration) <= spec.recording.durationTolerance,
     `${last}s vs target ${spec.recording.targetDuration}s`);
  for (const sc of spec.scenes) {
    const late = sc.actions.filter(a => a.at !== undefined && a.at > sc.end);
    ok(`scene ${sc.index} actions inside its window`, late.length === 0, `${sc.start}s to ${sc.end}s`);
  }
  const cues = spec.browserFrame.tabs.filter(t=>t.credibilityCue).length;
  ok('at most one credibility cue in the frame', cues <= 1, `${cues} of ${spec.browserFrame.tabs.length} tabs`);
  ok('tab count matches declared', spec.browserFrame.tabs.length === spec.browserFrame.tabCount);
  ok('active tab index matches the active tab', spec.browserFrame.tabs[spec.browserFrame.activeTabIndex]?.active === true);

  await b.close();
  console.log(`\n${fail ? fail + ' FAILED' : 'all checks passed'}`);
  process.exit(fail ? 1 : 0);
})();
