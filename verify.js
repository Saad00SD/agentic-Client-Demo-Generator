/* ============================================================
   XPENG Vector — verification suite
   Run with a static server on :8099 from the build root:
     python3 -m http.server 8099 &
     node verify.js

   Everything the demo asserts on screen is checked here against the one data
   spine it derives from. A demo that contradicts itself in a live meeting is
   worse than one that shows less.
   ============================================================ */
const { chromium } = require('/opt/node-tools/node_modules/playwright-core');
const BASE = process.env.DEMO_BASE || 'http://localhost:8099';

/* The build loads no external resources, but a browser still probes a few
   well-known endpoints. Blocking everything off-localhost keeps page loads
   deterministic and fast, which is the same property the recording needs. */
const seal = async target => target.route('**/*', r =>
  r.request().url().startsWith(BASE) ? r.continue() : r.abort());

const PAGES = ['index','campaigns','first-time-fix','genuine-parts','ev-service-ready',
  'service-league','next-service-booked','points-bank','shop','voucher-wallet',
  'dashboard','sherbot','commercial','network','network-intelligence','help'];
const PARTICIPANT = PAGES.filter(p => !['dashboard','sherbot','network','network-intelligence'].includes(p));

let pass = 0, fail = 0;
const chk = (name, ok, detail) => {
  ok ? pass++ : fail++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail !== undefined ? '   ' + detail : ''}`);
};
const eq = (name, a, b) => chk(name, a === b, `${a} vs ${b}`);

(async () => {
  const b = await chromium.launch({ executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args:['--no-sandbox'] });

  /* ---------- 1. data spine reconciliation ---------- */
  console.log('\n— DATA RECONCILIATION —');
  const p0 = await b.newPage(); await seal(p0);
  await p0.goto(BASE + '/network.html', { waitUntil:'domcontentloaded' });
  const D = await p0.evaluate(() => JSON.parse(JSON.stringify(DEMO)));

  const P = D.programme, R = P.regionRows, S = D.network.sites, PEOPLE = D.network.people;
  const sum = (arr, k) => arr.reduce((a, r) => a + r[k], 0);

  eq('ledger sums to balance',            D.points.ledger.reduce((a,l)=>a+l.pts,0), D.points.balance);
  eq('wallet value = ledger redemptions', D.wallet.reduce((a,v)=>a+v.pts,0),
     -D.points.ledger.filter(l=>l.dir==='out').reduce((a,l)=>a+l.pts,0));

  eq('region targets sum to programme',   sum(R,'targetNetwork'), P.targetNetwork);
  eq('region invited sum to programme',   sum(R,'invited'),       P.invited);
  eq('region registered sum to programme',sum(R,'enrolled'),      P.enrolled);
  eq('region active sum to programme',    sum(R,'active'),        P.activeMonth);
  eq('region retailers sum to programme', sum(R,'sites'),         P.branches);
  chk('funnel never widens', R.every(r => r.targetNetwork >= r.invited && r.invited >= r.enrolled && r.enrolled >= r.active)
      && P.targetNetwork >= P.invited && P.invited >= P.enrolled && P.enrolled >= P.activeMonth);

  const uk = R.find(r => r.region === D.network.expandedRegion);
  eq('retailer targets sum to region',    sum(S,'targetNetwork'), uk.targetNetwork);
  eq('retailer invited sum to region',    sum(S,'invited'),       uk.invited);
  eq('retailer registered sum to region', sum(S,'enrolled'),      uk.enrolled);
  eq('retailer active sum to region',     sum(S,'active'),        uk.active);
  eq('retailer count matches region',     S.length,               uk.sites);

  /* The site table renders in data order, unsorted, so the data order IS the
     displayed order. A network table that claims to be ordered by size and is
     not is the kind of thing an operations reader spots in a second. */
  chk('retailer table ordered by network size',
      S.every((x,i) => i === 0 || S[i-1].targetNetwork >= x.targetNetwork),
      'descending targetNetwork');

  const bristol = S.find(x => x.name === D.network.expandedSite);
  eq('roster size = retailer registered', PEOPLE.length,          bristol.enrolled);
  eq('active roster = retailer active',   PEOPLE.filter(x=>x.status==='active').length, bristol.active);

  const F = D.firstTimeFix, G = D.genuineParts, C = D.certification, N = D.nextService;
  const band = F.bands.filter(x => x.target <= F.unitsToDate).slice(-1)[0];
  const earned = F.unitsToDate * band.rate + G.orders * G.ratePerOrder
               + C.modules.filter(m=>m.done).length * C.perModule;
  const me = PEOPLE.find(x => x.me), ilMe = D.individualLeague.rows.find(r => r.me);
  eq('participant points = campaign sum',  me.pts, earned);
  eq('league points = roster points',      ilMe.pts, me.pts);
  chk('league is strictly descending',     D.individualLeague.rows.every((r,i,a) => i===0 || a[i-1].pts > r.pts));
  chk('league ranks are sequential',       D.individualLeague.rows.every((r,i) => r.rank === i+1));
  chk('site league rows sum to totals',    D.league.rows.every(r => r.s.reduce((a,x)=>a+x,0) === r.total));
  eq('my site league total',               D.league.me.s.reduce((a,x)=>a+x,0), D.league.me.total);
  eq('retailer league size = network',     D.league.participants, P.branches);

  eq('ladder weekly = drives to date',     F.weekly.slice(-1)[0].cumulative, F.unitsToDate);
  eq('conversion weekly = orders',         G.rows.reduce((a,r)=>a+r.n,0), G.orders);
  eq('conversion weekly value = earned',   G.rows.reduce((a,r)=>a+r.reward,0), G.orders * G.ratePerOrder);
  eq('retention weekly days',              N.weekly.reduce((a,w)=>a+w.jobs,0), N.jobs);
  eq('retention weekly booked',            N.weekly.reduce((a,w)=>a+w.booked,0), N.booked);
  eq('one drive population across campaigns', F.unitsToDate, G.drives);
  /* Orders come out of completed drives, and booked days out of working days.
     Two populations, each with its own floor, so the check is two checks. */
  chk('orders never exceed completed drives', G.orders <= G.drives, `${G.orders} of ${G.drives}`);
  chk('booked days never exceed working days', N.booked <= N.jobs, `${N.booked} of ${N.jobs}`);

  eq('reward by campaign = points issued', sum(P.rewardByCampaign,'pts'), P.rewardPts);
  chk('campaign health sums to active',    P.campaignHealth.every(c => c.onTarget + c.below === P.activeMonth));

  /* ---------- 2. campaign count and mechanism range ---------- */
  console.log('\n— CAMPAIGNS —');
  const real = D.rail.filter(r => r.href !== '#');
  chk('five or more usable campaigns', real.length >= 5, real.length + ' with a page');
  chk('five distinct mechanisms', new Set(real.map(r => r.type)).size >= 5,
      [...new Set(real.map(r => r.type))].join(', '));
  await p0.close();

  /* ---------- 3. every page loads clean ---------- */
  console.log('\n— PAGES —');
  for (const n of PAGES) {
    const p = await b.newPage(); await seal(p);
    const errs = [], bad = [];
    p.on('pageerror', e => errs.push(String(e).split('\n')[0]));
    p.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0,80)); });
    p.on('response', r => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url().split('/').pop()); });
    await p.goto(`${BASE}/${n}.html`, { waitUntil:'domcontentloaded' });
    await p.waitForTimeout(150);
    const info = await p.evaluate(() => ({
      broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0).length,
      len: document.body.innerText.length,
      stale: /Geely|Uptime|First Time Fix|Genuine Parts|EV Service Ready|service centre|Service Adviser|€/.test(document.body.innerText)
    }));
    chk(`page ${n}`, !errs.length && !bad.length && !info.broken && !info.stale && info.len > 400,
        errs.concat(bad).slice(0,2).join(' ; ') || (info.stale ? 'stale content' : ''));
    await p.close();
  }

  /* ---------- 4. deterministic drill-down ---------- */
  console.log('\n— DRILL-DOWN —');
  const dp = await b.newPage({ viewport:{width:1440,height:1000} }); await seal(dp);
  const level = () => dp.evaluate(() => ({
    crumb: [...document.querySelectorAll('#drillCrumb li')].map(l=>l.textContent.trim()).join(' > '),
    rows: document.querySelectorAll('#drillRows .drow').length,
    person: !document.getElementById('personView').hidden
  }));
  await dp.goto(BASE + '/network.html', { waitUntil:'domcontentloaded' }); await dp.waitForTimeout(250);
  let L = await level(); chk('level 0 United Kingdom', L.crumb === 'United Kingdom' && L.rows === 7, L.crumb);
  await dp.click('[data-drill="South%20East"]'); await dp.waitForTimeout(200);
  L = await level(); chk('level 1 region', L.crumb.endsWith('South East') && L.rows === 14, `${L.rows} retailers`);
  await dp.click('[data-drill="South%20East/XPENG%20Guildford"]'); await dp.waitForTimeout(200);
  L = await level(); chk('level 2 retailer', L.crumb.endsWith('XPENG Guildford') && L.rows === 8, `${L.rows} people`);
  await dp.click('[data-drill="South%20East/XPENG%20Guildford/XP-GLD-04"]'); await dp.waitForTimeout(250);
  L = await level(); chk('level 3 individual', L.person && L.crumb.endsWith('Dan Whitfield'), L.crumb);
  await dp.click('#drillCrumb a:first-child'); await dp.waitForTimeout(200);
  L = await level(); chk('breadcrumb returns to national', L.crumb === 'United Kingdom');
  for (const h of ['#Scotland','#South%20East/XPENG%20Guildford','#South%20East/XPENG%20Guildford/XP-GLD-04']) {
    await dp.goto(BASE + '/network.html' + h, { waitUntil:'domcontentloaded' }); await dp.waitForTimeout(250);
    const ok = await dp.evaluate(() => document.querySelectorAll('#drillCrumb li').length > 1);
    chk('deep link ' + decodeURIComponent(h), ok);
  }
  await dp.close();

  /* ---------- 5. recording readiness ---------- */
  /* This programme is UK only, so points and sterling are the same number. What a
     UK participant's points are worth. The two must never be printed as if they
     were the same thing. A screen that says "533 pts" in one place and "£533" in
     another, with nothing joining them, invites the one question a demo cannot
     afford: which is it. */
  {
    const cp = await b.newPage({ viewport:{width:1440,height:900} }); await seal(cp);
    const bal = D.points.balance;
    const offenders = [];
    for (const n of PARTICIPANT) {
      await cp.goto(`${BASE}/${n}.html`, { waitUntil:'domcontentloaded' }); await cp.waitForTimeout(140);
      const bad = await cp.evaluate(b => {
        const out = [];
        const want = new RegExp('£\\s*' + b.toLocaleString('en-GB').replace(/,/g,'[,.]?') + '\\b');
        document.querySelectorAll('*').forEach(el => {
          if (el.children.length) return;
          const t = (el.textContent || '').trim();
          if (!want.test(t)) return;
          const ctx = ((el.parentElement && el.parentElement.textContent) || t).toLowerCase();
          if (!/worth|point|punkt|wert/.test(ctx)) out.push(t.slice(0, 40));
        });
        return out;
      }, bal);
      bad.forEach(t => offenders.push(`${n}: ${t}`));
    }
    chk('points balance never printed as bare currency', offenders.length === 0,
        offenders.length ? offenders.join(' / ') : `£${bal} always qualified`);
    await cp.close();
  }

  console.log('\n— RECORDING —');
  const rp = await b.newPage({ viewport:{width:1440,height:900} }); await seal(rp);
  const rms = new Map();
  for (const n of PAGES) {
    await rp.goto(`${BASE}/${n}.html`, { waitUntil:'domcontentloaded' }); await rp.waitForTimeout(120);
    (await rp.evaluate(() => [...document.querySelectorAll('[data-rm]')].map(e => e.dataset.rm)))
      .forEach(id => rms.set(id, n));
  }
  chk('stable recording selectors present', rms.size >= 15, rms.size + ' data-rm targets');

  /* headline figures readable at recording size */
  await rp.goto(BASE + '/network.html', { waitUntil:'domcontentloaded' }); await rp.waitForTimeout(250);
  const small = await rp.evaluate(() => [...document.querySelectorAll('.fn-n,.vs-n')]
    .map(e => parseFloat(getComputedStyle(e).fontSize)).filter(s => s < 26));
  chk('headline KPIs large enough', small.length === 0, small.length ? small.join(',') + 'px' : '>=26px');

  /* nothing important is hover-only */
  const hoverOnly = await rp.evaluate(() =>
    [...document.querySelectorAll('[title]')].filter(e => !e.textContent.trim() && !e.getAttribute('aria-label')).length);
  chk('no hover-only content', hoverOnly === 0, hoverOnly + ' title-only elements');

  /* Reset returns a known state. This build carries one language, so there is
     no language to clear; what has to clear is the drill level and the scroll. */
  await rp.click('[data-drill="South%20East"]'); await rp.waitForTimeout(200);
  await rp.evaluate(() => window.scrollTo(0, 600)); await rp.waitForTimeout(120);
  await rp.goto(BASE + '/network.html?reset=1', { waitUntil:'domcontentloaded' }); await rp.waitForTimeout(250);
  const after = await rp.evaluate(() => ({
    lang: getLang(), hash: location.hash, scroll: Math.round(window.scrollY),
    crumb: [...document.querySelectorAll('#drillCrumb li')].map(l=>l.textContent.trim()).join(' > ')
  }));
  chk('reset clears level and scroll',
      after.lang === 'en' && after.hash === '' && after.scroll === 0 && after.crumb === 'United Kingdom',
      JSON.stringify(after));
  await rp.close();

  /* ---------- 6. language ---------- */
  console.log('\n— LANGUAGE —');
  {
    const lp = await b.newPage(); await seal(lp);
    await lp.goto(`${BASE}/index.html`, { waitUntil:'domcontentloaded' }); await lp.waitForTimeout(150);
    const st = await lp.evaluate(() => ({
      langs: LANGS.map(l => l.code),
      dicts: Object.keys(DICTS),
      pats : Object.keys(PATTERNS),
      switchRendered: !!document.querySelector('[data-lang-btn]')
    }));
    /* Five languages from the shared core. This build was English only until
       the core was introduced; the assertions moved with the decision. */
    const WANT = ['en','de','nl','fr','pl'];
    chk('five languages declared', WANT.every(c => st.langs.includes(c)) && st.langs.length === WANT.length, st.langs.join(','));
    chk('a dictionary exists for every non-English language',
        WANT.filter(c => c !== 'en').every(c => st.dicts.includes(c) && st.pats.includes(c)),
        'dicts ' + st.dicts.join(',') + ' · patterns ' + st.pats.join(','));
    /* More than one language, so the control must be there and must be usable. */
    chk('language switch rendered', st.switchRendered === true);
    chk('a flag button exists for each language',
        await lp.evaluate(w => w.every(c => !!document.querySelector('[data-lang-btn="' + c + '"]')), WANT), WANT.join(','));
    chk('the runtime still resolves a language', await lp.evaluate(() => typeof trString === 'function' && trString('Home','en') === null));
    chk('the core layer is shared, not forked',
        await lp.evaluate(() => typeof CORE === 'object' && typeof registerI18n === 'function'));

    /* Every language must cover every key the others do. A language that is
       merely present but half filled is worse than one that is absent. */
    const cover = await lp.evaluate(() => {
      const codes = Object.keys(DICTS);
      const all = new Set(); codes.forEach(c => Object.keys(DICTS[c]).forEach(k => all.add(k)));
      return codes.map(c => ({ code: c,
        entries: Object.keys(DICTS[c]).length,
        missing: [...all].filter(k => !(k in DICTS[c])).length,
        patterns: PATTERNS[c].length }));
    });
    cover.forEach(c => chk(`${c.code} dictionary complete`, c.missing === 0,
      `${c.entries} entries, ${c.patterns} patterns, ${c.missing} missing`));

    const FOREIGN = WANT.filter(c => c !== 'en');

    /* Switching must change the page and switching back must restore the exact
       English, not a translation of a translation. */
    for (const code of FOREIGN) {
      let switched = 0, restored = 0;
      for (const n of PARTICIPANT) {
        await lp.goto(`${BASE}/${n}.html`, { waitUntil: 'domcontentloaded' }); await lp.waitForTimeout(120);
        const snap = () => lp.evaluate(() => { const o = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
          let x; while (x = w.nextNode()) { const t = x.textContent.replace(/\s+/g, ' ').trim(); if (t) o.push(t); } return o.join(''); });
        const en1 = await snap();
        await lp.evaluate(c => setLang(c), code); const tr = await snap();
        await lp.evaluate(() => setLang('en')); const en2 = await snap();
        if (en1 !== tr) switched++;
        if (en1 === en2) restored++;
      }
      eq(`every participant page switches · ${code}`, switched, PARTICIPANT.length);
      eq(`every participant page restores · ${code}`, restored, PARTICIPANT.length);
    }

    /* No string that HAS a translation may still render in English, on any page,
       with every tab pane opened. This is the check that proves the language is
       real rather than decorative. */
    for (const code of FOREIGN) {
      const leaks = [];
      for (const n of PAGES) {
        await lp.goto(`${BASE}/${n}.html?reset=1`, { waitUntil: 'domcontentloaded' }); await lp.waitForTimeout(160);
        await lp.evaluate(() => document.querySelectorAll('[data-tabs] button,[data-ltabs] button,.acc-btn').forEach(x => x.click()));
        await lp.waitForTimeout(120);
        await lp.evaluate(c => setLang(c), code); await lp.waitForTimeout(160);
        const bad = await lp.evaluate(c => {
          const dict = DICTS[c]; const out = [];
          document.querySelectorAll('body *').forEach(el => {
            if (el.children.length) return;
            if (el.closest('script,style')) return;
            const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
            if (!t) return;
            if (dict[t] && dict[t] !== t) out.push(t.slice(0, 60));
          });
          return out;
        }, code);
        bad.forEach(t => leaks.push(`${n}: ${t}`));
      }
      chk(`no translated phrase renders in English · ${code}`, leaks.length === 0,
          leaks.length ? [...new Set(leaks)].slice(0, 4).join(' / ') : 'clean');
    }

    /* A pattern rule that returns null must fall through, not throw. Getting this
       wrong aborts the tree walk and leaves the rest of the page in English. */
    /* A pattern rule that returns null must fall through, not throw. Getting this
       wrong aborts the tree walk and leaves every node after it in English, which
       is exactly how it was found. The passing result is either null (no rule
       claimed the string) or a string that still carries the untranslatable part;
       what must never happen is an exception. */
    chk('a pattern rule returning null falls through instead of throwing',
        await lp.evaluate(() => {
          try {
            const t = trString('12 Sep · a label held in no dictionary', 'de');
            return t === null || (typeof t === 'string' && t.includes('a label held in no dictionary'));
          } catch (e) { return false; }
        }));

    /* The choice is held in localStorage, which is what carries it across a full
       page navigation on a static build. */
    await lp.evaluate(() => setLang('de'));
    await lp.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
    await lp.click('.nav a[href="campaigns.html"]'); await lp.waitForLoadState('networkidle'); await lp.waitForTimeout(250);
    chk('language survives navigation',
        (await lp.evaluate(() => document.querySelector('.nav a').textContent.trim())) === 'Start');
    await lp.evaluate(() => setLang('en'));

    /* Capability names are product names and stay English in every language.
       Voice of the Network is the one capability name this build carries. */
    for (const code of FOREIGN) {
      await lp.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' });
      await lp.waitForTimeout(180);
      await lp.evaluate(c => setLang(c), code); await lp.waitForTimeout(320);
      const names = await lp.evaluate(() => {
        const root = document.querySelector('[data-rm="rm-von-prompt"]');
        return root ? root.textContent.replace(/\s+/g, ' ') : '';
      });
      chk('capability name stays English in ' + code,
          names.includes('Voice of the Network'), names.slice(0, 90));
    }
    await lp.evaluate(() => setLang('en'));
    await lp.close();
  }

  /* ---------- 6b. Voice of the Network — the coming soon guarantee ---------- */
  /* The one failure that actually costs money is a prospect believing this
     ships today. Three things are checked: the badge is on every surface, the
     controls are inert, and the capability is never named on a screen that
     does not also say coming soon. */
  console.log('\n— VOICE OF THE NETWORK —');
  {
    const vp = await b.newPage({ viewport: { width: 1440, height: 1000 } }); await seal(vp);

    const soonRoot = async (page, rm) => page.evaluate(sel => {
      const el = document.querySelector(sel);
      if (!el) return { found: false };
      return { found: true, text: (el.innerText || '').replace(/\s+/g, ' ').trim() };
    }, `[data-rm="${rm}"]`);

    for (const [pageName, rm] of [['index', 'rm-von-prompt'], ['index', 'rm-von-open'],
                                  ['network-intelligence', 'rm-ni-panel']]) {
      await vp.goto(`${BASE}/${pageName}.html`, { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(350);
      const r = await soonRoot(vp, rm);
      chk(`${rm} exists on ${pageName}`, r.found);
      chk(`${rm} carries a visible Coming soon badge`, r.found && /coming\s*soon/i.test(r.text),
          r.found ? r.text.slice(0, 70) : 'missing');
    }

    /* Nothing on either participant surface may look operable. */
    await vp.goto(BASE + '/index.html', { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(350);
    const vonBtns = await vp.evaluate(() => [...document.querySelectorAll('.von button, .von-open button')]
      .map(x => ({ t: (x.textContent || '').trim().slice(0, 24), d: x.disabled })));
    const vonLive = vonBtns.filter(x => !x.d).map(x => x.t);
    chk('every Voice of the Network control is disabled',
        vonBtns.length > 0 && vonLive.length === 0,
        vonBtns.length === 0 ? 'no controls found'
          : vonLive.length ? `${vonLive.length} of ${vonBtns.length} operable: ` + vonLive.join(', ')
          : `${vonBtns.length} controls, all disabled`);
    chk('the module cannot switch the badge off', await vp.evaluate(() => typeof VON !== 'undefined' && VON.ALWAYS_COMING_SOON === true));

    /* The guarantee itself, across every page: wherever the capability is named
       on screen, a coming soon marker sits in the same section root. */
    const VON_SECTION_ROOTS = '.von,.von-open,.ni,.widget,.panel,section,.admin-top,main,body';
    const vonViolations = [], vonNamed = [];
    for (const n of PAGES) {
      await vp.goto(`${BASE}/${n}.html`, { waitUntil: 'domcontentloaded' }); await vp.waitForTimeout(250);
      const res = await vp.evaluate(roots => {
        const out = [];
        const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = w.nextNode())) {
          if (node.parentElement && node.parentElement.closest('script,style')) continue;
          if (!/voice of the network/i.test(node.textContent || '')) continue;
          const root = node.parentElement && node.parentElement.closest(roots);
          const txt = root ? (root.textContent || '') : '';
          out.push({ ok: /coming\s*soon/i.test(txt),
                     where: (node.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) });
        }
        return out;
      }, VON_SECTION_ROOTS);
      if (res.length) vonNamed.push(n);
      res.filter(r => !r.ok).forEach(r => vonViolations.push(`${n}: "${r.where}"`));
    }
    chk('the capability is never named without Coming soon in the same section',
        vonViolations.length === 0, vonViolations.slice(0, 4).join(' / ') || `named on ${vonNamed.join(', ')}`);
    chk('the capability is named where it is shown',
        ['index', 'network-intelligence'].every(n => vonNamed.includes(n)), vonNamed.join(', '));
    await vp.close();
  }

  /* ---------- 7. forbidden commercial language ---------- */
  console.log('\n— COMMERCIAL GUARDRAILS —');
  const BAD = [/transparen/i, /per[- ]user/i, /setup fee/i, /monthly (price|fee)/i,
               /\breward margin/i, /redemption margin/i, /\bthe OEM\b/,
               /book a (call|meeting|demo)/i, /get in touch/i, /contact us/i, /request a demo/i];
  let hits = 0;
  const gp = await b.newPage(); await seal(gp);
  for (const n of PAGES) {
    await gp.goto(`${BASE}/${n}.html`, { waitUntil:'domcontentloaded' });
    await gp.evaluate(() => document.querySelectorAll('[data-tabs] button,[data-ltabs] button').forEach(x => x.click()));
    await gp.waitForTimeout(120);
    const txt = await gp.evaluate(() => document.body.innerText);
    for (const re of BAD) if (re.test(txt)) { hits++; console.log('     hit on ' + n + ': ' + txt.match(re)[0]); }
  }
  chk('no forbidden or sales language in the product UI', hits === 0);
  await gp.close();

  /* ---------- 8. layout ---------- */
  console.log('\n— LAYOUT —');
  /* German, French and Polish all set longer than English. The top bar and the
     band ladders are what break first, so every language is measured, not one. */
  for (const lang of ['en','de','nl','fr','pl']) for (const w of [1440, 390]) {
    const c = await b.newContext({ viewport:{width:w, height:1000} }); await seal(c);
    const sp = await c.newPage();
    await sp.goto(BASE + '/index.html');
    await sp.evaluate(l => localStorage.setItem('xpeng-vector-lang', l), lang);
    let over = [];
    for (const n of PAGES) {
      await sp.goto(`${BASE}/${n}.html`, { waitUntil:'domcontentloaded' }); await sp.waitForTimeout(100);
      const o = await sp.evaluate(() => ({ sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth }));
      if (o.sw !== o.cw) over.push(n);
    }
    chk(`no horizontal overflow · ${lang} · ${w}px`, over.length === 0, over.join(','));
    await c.close();
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  await b.close();
  process.exit(fail ? 1 : 0);
})();
