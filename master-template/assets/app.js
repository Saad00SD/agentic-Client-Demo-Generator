/* ============================================================
   XPENG Vector — shared behaviour
   Same Sherbet platform, configured for XPENG UK aftersales. Programme
   shape from the BYD Middle East dealer material.
   No network calls, no build step.
   ============================================================ */

/* ---------- language ----------------------------------------
   The flag pair in the top bar. Language is a personal setting,
   not a market one: the participant, the sites, the currency and
   the catalogue are the same in both languages.

   Every node keeps its English original in a WeakMap the first
   time it is touched, so switching back is the original string
   rather than a translation of a translation. The choice is held
   in localStorage, which is what carries it across a full page
   navigation on a twelve-page static build.
   ------------------------------------------------------------ */
const LANG_KEY = 'xpeng-vector-lang';
const _origText = new WeakMap();
const _origAttr = new WeakMap();

function getLang(){
  try {
    const v = localStorage.getItem(LANG_KEY);
    if(v && typeof LANGS !== 'undefined' && LANGS.some(l => l.code === v)) return v;
  }
  catch(e){ /* private window, or storage blocked */ }
  return (window.CLIENT_CONFIG || {}).defaultLanguage || 'en';
}

/* The dictionary and pattern list for a language code, or null for English and
   for anything not carried in this build. Adding a language is adding an object
   to DICTS and an entry to LANGS. Nothing else in the runtime changes. */
function dictFor(code){
  return (typeof DICTS !== 'undefined' && DICTS[code]) || null;
}
function patternsFor(code){
  return (typeof PATTERNS !== 'undefined' && PATTERNS[code]) || null;
}
function langTag(code){
  const l = (typeof LANGS !== 'undefined') && LANGS.find(x => x.code === code);
  return l ? l.tag : 'en-GB';
}
function setLang(code){
  try { localStorage.setItem(LANG_KEY, code); } catch(e){}
  applyLang();
}

/* German and Dutch both group thousands with a full stop. Strings are rendered
   in English first and translated afterwards, so the swap happens here rather
   than in the formatters. Only touches runs that are unambiguously grouped
   thousands, so a decimal such as 9.2 is left alone. */
function deNum(s){
  return s.replace(/\d{1,3}(?:,\d{3})+/g, m => m.replace(/,/g, '.'));
}

/* exact phrase first, then the runtime patterns, then leave it alone */
function trString(s, code){
  code = code || getLang();
  if(code === 'en') return null;
  const dict = dictFor(code), pats = patternsFor(code);
  const key = s.replace(/\s+/g,' ').trim();
  if(!key) return null;
  if(dict && Object.prototype.hasOwnProperty.call(dict, key)) return deNum(dict[key]);
  if(!pats) return null;
  for(const [re, out] of pats){
    const m = key.match(re);
    if(!m) continue;
    /* A pattern function returns null to mean "this rule does not apply after
       all", which happens when it needs a dictionary lookup that misses. Fall
       through to the next rule rather than treating null as a translation.
       Getting this wrong threw inside the tree walk and left every node after
       the failure in English, which reads as a half-translated page. */
    const t = (typeof out === 'function') ? out(...m) : key.replace(re, out);
    if(t === null || t === undefined) continue;
    return deNum(t);
  }
  /* a bare grouped number still needs continental grouping even with nothing to translate */
  if(/^\d{1,3}(?:,\d{3})+$/.test(key)) return deNum(key);
  return null;
}

const I18N_ATTRS = ['placeholder','aria-label','title','alt','label'];

const _renderedText = new WeakMap();
const _renderedAttr = new WeakMap();
let clientTextObserver;

function applyLang(){
  // Ignore our own writes, but pick up later modal, game and dashboard updates.
  if (clientTextObserver) clientTextObserver.disconnect();
  const code = getLang();
  document.documentElement.lang = langTag(code);
  const render = en => {
    let translated = null;
    try { translated = trString(en, code); } catch(e) { /* retain source */ }
    const lead = (en.match(/^\s*/) || [''])[0];
    const tail = (en.match(/\s*$/) || [''])[0];
    return clientText(translated === null ? en : lead + translated + tail);
  };
  const walk = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walk.nextNode())) {
    if (node.parentElement && node.parentElement.closest('script,style,textarea,input')) continue;
    if (!_origText.has(node) || node.textContent !== _renderedText.get(node)) {
      _origText.set(node, node.textContent);
    }
    const next = render(_origText.get(node));
    if (node.textContent !== next) node.textContent = next;
    _renderedText.set(node, next);
  }
  document.querySelectorAll('[placeholder],[aria-label],[title],[alt],optgroup[label]').forEach(el => {
    const source = _origAttr.get(el) || {};
    const rendered = _renderedAttr.get(el) || {};
    for (const attr of I18N_ATTRS) {
      if (!el.hasAttribute(attr)) continue;
      const current = el.getAttribute(attr);
      if (!(attr in source) || current !== rendered[attr]) source[attr] = current;
      const next = render(source[attr]);
      if (current !== next) el.setAttribute(attr, next);
      rendered[attr] = next;
    }
    _origAttr.set(el, source);
    _renderedAttr.set(el, rendered);
  });
  document.querySelectorAll('[data-lang-btn]').forEach(b =>
    b.classList.toggle('on', b.dataset.langBtn === code));
  if (!clientTextObserver) clientTextObserver = new MutationObserver(applyLang);
  clientTextObserver.observe(document.documentElement, {
    subtree: true, childList: true, characterData: true,
    attributes: true, attributeFilter: I18N_ATTRS
  });
}

function langSwitch(){
  /* One language, nothing to switch. The control renders only when the build
     carries more than one, so a second language is still a data addition. */
  if(typeof LANGS === 'undefined' || LANGS.length < 2) return '';
  const cur = getLang();
  return `<div class="langsw" role="group" aria-label="Language">
    ${LANGS.map(l=>`<button type="button" data-lang-btn="${l.code}"
        class="${l.code===cur?'on':''}" title="${l.label}" aria-label="${l.label}"
        lang="en">${l.flag}</button>`).join('')}
  </div>`;
}

/* ---------- recording reset ----------------------------------
   Browser automation needs a known starting state on every take. The only
   thing this build persists is the language choice, so a reset is one key
   and one line, and it is deliberately not a visible control: it belongs to
   whoever is filming, not to anyone being shown the demo.

     ?reset=1   in the URL, for a scripted run
     Shift+0    from the keyboard, for a manual take

   Both put the language back to English, clear the drill-down level and
   scroll to the top. Nothing else in the build carries state.
   ------------------------------------------------------------ */
function resetDemo(opts){
  opts = opts || {};
  try { localStorage.removeItem(LANG_KEY); } catch(e){}
  if(location.hash) history.replaceState(null, '', location.pathname + location.search);
  if(typeof applyLang === 'function') applyLang();
  window.scrollTo({ top:0, behavior:'auto' });
  if(opts.reload) location.reload();
}

function wireReset(){
  const q = new URLSearchParams(location.search);
  if(q.get('reset') === '1'){
    try { localStorage.removeItem(LANG_KEY); } catch(e){}
    history.replaceState(null, '', location.pathname);
  }
  document.addEventListener('keydown', e => {
    if(e.shiftKey && e.key === ')' || (e.shiftKey && e.code === 'Digit0')){
      e.preventDefault(); resetDemo({reload:true});
    }
  });
}

/* ---------- dynamic branding & client config ------------------ */
function applyBranding() {
  const cfg = window.CLIENT_CONFIG || {};
  const b = cfg.branding || {};
  const root = document.documentElement.style;

  if (b.primaryColor) {
    root.setProperty('--blue', b.primaryColor);
    root.setProperty('--accent', b.primaryColor);
    root.setProperty('--brand-primary', b.primaryColor);
  }
  if (b.secondaryColor) {
    root.setProperty('--black', b.secondaryColor);
    root.setProperty('--brand-dark', b.secondaryColor);
    root.setProperty('--grey-90', b.secondaryColor);
  }
  if (b.accentColor) {
    root.setProperty('--citrus', b.accentColor);
    root.setProperty('--brand-accent', b.accentColor);
  }
  if (b.darkCardColor) root.setProperty('--grey-90', b.darkCardColor);
  if (b.surfaceColor) root.setProperty('--white', b.surfaceColor);
  if (b.pageBgColor) root.setProperty('--grey-30', b.pageBgColor);
}

// Replace display text only: URLs, asset filenames and internal network keys stay intact.
// A single pass keeps replacement values literal, even when they contain template words.
function clientText(text) {
  const cfg = window.CLIENT_CONFIG || {};
  const country = cfg.country || {};
  const name = country.name || (cfg.countryConfig || {}).country;
  const programme = [cfg.clientName, cfg.platformName].filter(Boolean);
  const title = cfg.clientName && cfg.platformName && cfg.clientName.endsWith(' ' + cfg.platformName)
    ? cfg.clientName : programme.join(' ');
  const values = {
    'XPENG Vector': title,
    'XPENG': cfg.clientName,
    'Vector': cfg.platformName,
    'Drive the Future': cfg.tagline,
    'United Kingdom': name,
    'UK': country.code || name,
    'GBP': country.currency,
    '\u00a3': country.symbol,
    'Vereinigtes K\u00f6nigreich': name,
    'Vereinigten K\u00f6nigreich': name,
    'Verenigd Koninkrijk': name,
    'Royaume-Uni': name,
    'Wielka Brytania': name,
    'Wielkiej Brytanii': name,
    'VK': country.code || name,
    'British': name,
    'britische': name,
    'Britse': name,
    'britannique': name,
    'britanniques': name,
    'brytyjski': name,
    'brytyjskiej': name,
    'brytyjskich': name
  };
  return text.replace(/XPENG Vector|(?<![a-zA-Z])XPENG(?![a-zA-Z])|(?<![a-zA-Z])Vector(?![a-zA-Z])|Drive the Future|United Kingdom|Vereinigtes K\u00f6nigreich|Vereinigten K\u00f6nigreich|Verenigd Koninkrijk|Royaume-Uni|Wielka Brytania|Wielkiej Brytanii|\bUK\b|\bVK\b|\bGBP\b|\bBritish\b|\bbritische\b|\bBritse\b|\bbritanniques?\b|\bbrytyjski(?:ej|ch)?\b|\u00a3/gi,
    token => values[Object.keys(values).find(key => key.toLowerCase() === token.toLowerCase())] || token);
}

function applyClientTextReplacement() {
  const cfg = window.CLIENT_CONFIG || {};
  applyBranding();
  document.querySelectorAll('.client-platform-tag').forEach(el => {
    if (cfg.platformName) el.textContent = cfg.platformName.toUpperCase();
  });
  document.querySelectorAll('.client-tagline-tag').forEach(el => {
    if (cfg.tagline) el.textContent = cfg.tagline;
  });
}

/* ---------- shared chrome ---------------------------------- */
function topbar(active, opts){
  opts = opts || {};
  const cfg = window.CLIENT_CONFIG || {};
  const b = cfg.branding || {};
  const clientName = cfg.clientName || 'XPENG UK';
  const platformName = cfg.platformName || 'Vector';
  const logo = b.logo || 'assets/xpeng-lockup.png';
  const c = DEMO.customer;

  const items = [
    ['Home','index.html'],
    ['Campaigns','campaigns.html'],
    ['Shop','shop.html'],
    ['Points Bank','points-bank.html'],
    ['Voucher Wallet','voucher-wallet.html'],
  ];

  const adminItems = [
    ['Dashboard','dashboard.html'],
    ['Network','network.html'],
    ['Analytics','network-intelligence.html'],
    ['Sherbot','sherbot.html'],
    ['|',null],
    ['Commercial','commercial.html']
  ];
  const navItems = opts.admin ? adminItems : items;

  const who = opts.admin
    ? {name:'Programme Office', pts: clientName, ini:'PO', img:null}
    : {name: (cfg.customer && cfg.customer.owner) || c.owner, pts: pts(DEMO.points.balance) + ' pts', ini: (cfg.customer && cfg.customer.initials) || c.initials, img:null};

  const branches = (cfg.countryConfig && cfg.countryConfig.branches) || ['XPENG Guildford', 'XPENG Leeds', 'XPENG Manchester'];
  const branchOptions = branches.map(br => `<option>${br}</option>`).join('');

  return `
  <header class="topbar">
    <div class="topbar-in">
      <a class="brand" href="index.html" aria-label="${clientName} ${platformName} home">
        <img class="brand-logo" src="${logo}" alt="${clientName}" style="max-height:38px;width:auto;max-width:160px;object-fit:contain;vertical-align:middle;">
        <span class="brand-sub">${platformName}</span>
      </a>
      <button class="navtoggle" id="navtoggle" aria-label="Menu" aria-expanded="false">
        <svg width="20" height="14" viewBox="0 0 20 14" fill="none" stroke="currentColor" stroke-width="1.8">
          <path d="M0 1h20M0 7h20M0 13h20"/></svg>
      </button>
      <nav class="nav" id="nav">
        ${navItems.map(([l,h])=> h===null ? `<span class="nav-sep" aria-hidden="true">${l}</span>` : `<a href="${h}"${l===active?' class="on" aria-current="page"':''}>${l}</a>`).join('')}
      </nav>
      <a class="help-tab" href="help.html">Help</a>
      <a class="help-tab" href="game-mechanics.html" style="background:none;border:1px solid var(--line-dark);color:var(--on-dark)">Game Mechanics</a>
      <div class="tb-right">
        ${langSwitch()}
        <button class="icobtn" aria-label="Basket">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M2 4h2l2.4 9.3A2 2 0 008.3 15h6.5a2 2 0 001.9-1.5L18 7H5"/><circle cx="8.5" cy="18" r="1.2"/><circle cx="15.5" cy="18" r="1.2"/></svg>
        </button>
        <button class="icobtn" aria-label="Notifications">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M10 2a5 5 0 015 5v4l1.5 3h-13L5 11V7a5 5 0 015-5zM8 17a2 2 0 004 0"/></svg>
          <span class="dot"></span>
        </button>
        <div class="who">
          <span class="avatar">${who.img
            ? `<img src="${who.img}" alt="">`
            : who.ini}</span>
          <span class="who-txt"><span class="who-name">${who.name}</span><br><span class="who-pts">${who.pts}</span></span>
        </div>
        <a class="icobtn" href="index.html" aria-label="Sign out">
          <svg width="17" height="17" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6">
            <path d="M12 2H4v16h8M9 10h9m0 0l-3-3m3 3l-3 3"/></svg>
        </a>
      </div>
    </div>
  </header>
  <div class="switchbar">
    <div class="switchbar-in">
      <span class="switch-lbl">Role</span>
      <select class="sel" id="roleSel" aria-label="Role">
        <optgroup label="${clientName} partner network">
          <option value="cust:exec"${opts.admin?'':' selected'}>Retailer Owner / Dealer Principal</option>
          <option value="cust:manager">Aftersales Manager</option>
          <option value="cust:principal">Parts & Service Specialist</option>
        </optgroup>
        <optgroup label="${clientName}">
          <option value="lkq:regional">Regional Operations Manager</option>
          <option value="lkq:national"${opts.admin?' selected':''}>Programme Office (${clientName})</option>
        </optgroup>
      </select>
      <span class="switch-lbl">${opts.admin?'Region':'Retailer'}</span>
      <select class="sel" id="placeSel" aria-label="${opts.admin?'Region':'Retailer'}">
        ${opts.admin
          ? `<option>All regions</option>` + ((cfg.countryConfig && cfg.countryConfig.regions) || ['North', 'Central', 'South']).map(r=>`<option>${r}</option>`).join('')
          : branchOptions}
      </select>
      <span class="illus on-dark"><i></i>Illustrative demonstration data</span>
    </div>
  </div>`;
}

function footer(){
  const cfg = window.CLIENT_CONFIG || {};
  const b = cfg.branding || {};
  const clientName = cfg.clientName || 'XPENG UK';
  const platformName = cfg.platformName || 'Vector';
  const tagline = cfg.tagline || 'Drive the Future';
  const logo = b.logo || 'assets/xpeng-lockup-dark.png';
  const country = (cfg.country && cfg.country.name) || (cfg.countryConfig && cfg.countryConfig.country) || 'UK';

  return `
  <footer class="foot">
    <div class="foot-band">
      <div class="sub-band">
        <b>Get ${clientName} ${platformName} updates straight to your inbox</b>
        <a class="btn" href="#" onclick="return false">Subscribe Now</a>
      </div>
    </div>
    <div class="foot-mid">
      <img src="${logo}" alt="${clientName}" style="max-height:48px;width:auto;max-width:200px;object-fit:contain;margin:0 auto;display:block">
      <span class="foot-tagline-txt">${platformName} · ${tagline} (${country})</span>
    </div>
    <div class="foot-bot">
      <span><a href="#" onclick="return false">Terms of use</a> &nbsp;|&nbsp; <a href="#" onclick="return false">Registration Support</a></span>
      <span class="illus on-dark"><i></i>Demonstration build for ${clientName} · illustrative data throughout</span>
      <span class="powered">powered by <b>Sherbet.</b></span>
    </div>
  </footer>`;
}

/* ---------- mount + wire ----------------------------------- */
function mountChrome(active, opts){
  applyBranding();
  const chromeEl = document.getElementById('chrome');
  const footEl = document.getElementById('foot');
  if (chromeEl) chromeEl.innerHTML = topbar(active, opts);
  if (footEl) footEl.innerHTML = footer();
  applyClientTextReplacement();

  document.querySelectorAll('[data-lang-btn]').forEach(b=>
    b.addEventListener('click', ()=> setLang(b.dataset.langBtn)));

  const nt = document.getElementById('navtoggle');
  const nv = document.getElementById('nav');
  if (nt && nv) {
    nt.addEventListener('click', ()=>{
      const open = nv.classList.toggle('open');
      nt.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  }

  const roleSel = document.getElementById('roleSel');
  if (roleSel) {
    roleSel.addEventListener('change', e=>{
      location.href = e.target.value.startsWith('lkq:') ? 'dashboard.html' : 'index.html';
    });
  }
}

/* ---------- tabs (evidenced campaign tab bar) --------------- */
function wireTabs(){
  document.querySelectorAll('[data-tabs]').forEach(bar=>{
    const panes = document.querySelectorAll('[data-pane]');
    bar.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        bar.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
        btn.classList.add('on');
        const t = btn.dataset.tab;
        panes.forEach(p=>p.classList.toggle('on', p.dataset.pane === t));
        window.scrollTo({top: bar.getBoundingClientRect().bottom + window.scrollY - 60, behavior:'smooth'});
      });
    });
  });
}

/* ---------- open the Campaign Game tab when linked via #campaignGame --- */
function openGameFromHash(){
  if(location.hash !== '#campaignGame') return;
  const target = document.getElementById('campaignGame');
  if(!target) return;
  const pane = target.closest('[data-pane]');
  if(pane){
    const tab = pane.dataset.pane;
    const btn = document.querySelector('[data-tabs] button[data-tab="' + tab + '"]');
    if(btn) btn.click();
  }
  setTimeout(()=>{ target.scrollIntoView({behavior:'smooth', block:'center'}); }, 60);
}

/* ---------- accordion (evidenced T&Cs pattern) -------------- */
function wireAccordion(){
  document.querySelectorAll('.acc-btn').forEach(b=>{
    b.addEventListener('click', ()=>{
      const row = b.closest('.acc-row');
      const open = row.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true':'false');
    });
  });
}

/* ---------- dynamic campaign hero & page data ------------------ */
function renderHeroCarousel(){
  const car = document.getElementById('heroCarousel');
  if(!car) return;
  const cfg = window.CLIENT_CONFIG || {};
  if(!cfg.campaigns || !cfg.campaigns.length) return;

  const detailPages = ['first-time-fix.html', 'service-league.html', 'genuine-parts.html', 'ev-service-ready.html', 'next-service-booked.html'];
  const campaigns = cfg.campaigns;

  const slidesHtml = campaigns.map((c, idx) => {
    const isFirst = idx === 0;
    const targetHref = c.href || detailPages[idx % detailPages.length];
    const imgPath = c.img || c.tileImage || 'assets/img/kv-test-drive.jpg';
    return `
    <div class="slide ${isFirst ? 'on' : ''}">
      <div class="slide-kv"><img src="${imgPath}" alt="${c.name || ''}"></div>
      <div class="slide-copy">
        <h3>${c.name}</h3>
        <p>${c.blurb || ''}</p>
        <div class="slide-actions">
          <a class="btn" href="${targetHref}">Learn more</a>
          <a class="gg-play-link" href="${targetHref}#campaignGame" target="_blank" rel="noopener">Campaign Game →</a>
        </div>
      </div>
    </div>`;
  }).join('');

  const dotsHtml = campaigns.map((_, idx) => `<button class="${idx === 0 ? 'on' : ''}" aria-label="Campaign ${idx + 1}"></button>`).join('');

  car.innerHTML = `
    <button class="carousel-arrow ca-prev" aria-label="Previous campaign">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 2L4 8l6 6"/></svg>
    </button>
    ${slidesHtml}
    <button class="carousel-arrow ca-next" aria-label="Next campaign">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2l6 6-6 6"/></svg>
    </button>
    <div class="dots">${dotsHtml}</div>`;
}

function applyCampaignDetailPageData() {
  const cfg = window.CLIENT_CONFIG || {};
  if (!cfg.campaigns || !cfg.campaigns.length) return;

  const path = location.pathname.split('/').pop() || 'index.html';
  const detailPages = ['first-time-fix.html', 'service-league.html', 'genuine-parts.html', 'ev-service-ready.html', 'next-service-booked.html'];
  
  const pageIdx = detailPages.indexOf(path);
  if (pageIdx === -1 && !cfg.campaigns.some(c => c.href === path)) return;

  const camp = cfg.campaigns.find(c => c.href === path) || cfg.campaigns[pageIdx % cfg.campaigns.length];
  if (!camp) return;

  const h1 = document.querySelector('.hero h1, .admin-top h1, h1');
  if (h1 && camp.name) {
    h1.innerHTML = camp.name;
  }

  const lede = document.querySelector('.hero-lede, p.hero-lede, .hero p');
  if (lede && camp.blurb) {
    lede.textContent = camp.blurb;
  }

  const kvImg = document.querySelector('.hero-media img, .slide-kv img, .campaign-kv img');
  if (kvImg && (camp.img || camp.tileImage)) {
    kvImg.src = camp.img || camp.tileImage;
    kvImg.alt = camp.name || '';
  }

  const ctype = document.querySelector('.ctype, .rcard-tag, .chip-type');
  if (ctype && camp.type) {
    ctype.textContent = camp.type;
  }
}

/* ---------- carousel (evidenced hero pattern) --------------- */
function wireCarousel(){
  renderHeroCarousel();
  const car = document.querySelector('[data-carousel]');
  if(!car) return;
  const slides = car.querySelectorAll('.slide');
  const dots   = car.querySelectorAll('.dots button');
  let i = 0;
  const go = n => {
    i = (n + slides.length) % slides.length;
    slides.forEach((s,k)=>s.classList.toggle('on', k===i));
    dots.forEach((d,k)=>d.classList.toggle('on', k===i));
  };
  dots.forEach((d,k)=>d.addEventListener('click',()=>go(k)));
  const p = car.querySelector('.ca-prev'), n = car.querySelector('.ca-next');
  if(p) p.addEventListener('click',()=>go(i-1));
  if(n) n.addEventListener('click',()=>go(i+1));
  go(0);
}

/* ---------- ledger tabs + credit reveal --------------------- */
function wireLedger(){
  const bar = document.querySelector('[data-ltabs]');
  if(bar && !bar.dataset.wired){
    bar.dataset.wired = '1';
    bar.querySelectorAll('button').forEach(btn=>{
      btn.addEventListener('click',()=>{
        bar.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
        btn.classList.add('on');
        document.querySelectorAll('[data-lpane]').forEach(p=>
          p.classList.toggle('on', p.dataset.lpane === btn.dataset.ltab));
      });
    });
  }
  const row = document.getElementById('creditRow');
  if(row && !row.dataset.wired){
    row.dataset.wired = '1';
    row.addEventListener('click', ()=>{
      const note = document.getElementById('creditNote');
      const on = note.classList.toggle('on');
      row.classList.toggle('hl', on);
      if(on) note.scrollIntoView({behavior:'smooth', block:'center'});
    });
  }
  const search = document.getElementById('ledSearch');
  if(search && !search.dataset.wired){
    search.dataset.wired = '1';
    search.addEventListener('input', ()=>{
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll('#ledBody tr').forEach(tr=>{
        tr.style.display = !q || tr.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });
  }
}

/* ---------- admin filters ----------------------------------- */
function wireAdminFilters(){
  const sel = document.getElementById('regionFilter');
  if(!sel) return;
  const apply = () => {
    const r = sel.value;
    document.querySelectorAll('[data-region-row]').forEach(el=>{
      el.style.display = (r === 'All regions' || el.dataset.regionRow === r) ? '' : 'none';
    });
    const f = r === 'All regions'
      ? DEMO.programme
      : (() => {
          const row = DEMO.programme.regionRows.find(x=>x.region===r);
          return { enrolled:row.enrolled, invited:row.invited, activeMonth:row.active,
                   branches: Math.round(DEMO.programme.branches * row.invited / DEMO.programme.invited),
                   regions:1,
                   rewardPts: Math.round(DEMO.programme.rewardPts * row.active / DEMO.programme.activeMonth) };
        })();
    setText('kEnrolled', pts(f.enrolled));
    setText('kEnrolledSub', 'of ' + pts(f.invited) + ' invited');
    setText('kActive',   pts(f.activeMonth));
    setText('kBranches', pts(f.branches));
    setText('kBranchesSub', f.regions === 1 ? r + ' only' : f.regions + ' regions');
    setText('kReward',   pts(f.rewardPts));
    setText('kRewardSub', 'across ' + (f.regions === 1 ? 'this region' : f.regions + ' regions'));
    const pill = document.getElementById('filterEcho');
    if(pill) pill.textContent = r;
  };
  sel.addEventListener('change', apply);
  const place = document.getElementById('placeSel');
  if(place) place.addEventListener('change', e=>{ sel.value = e.target.value; apply(); });
  apply();
}
function setText(id, v){ const el = document.getElementById(id); if(el) el.textContent = v; }

/* ---------- SherBot prepared demonstration ------------------ */
function wireSherbot(){
  const form = document.getElementById('sbForm');
  if(!form) return;
  const input = document.getElementById('sbInput');
  const body  = document.getElementById('sbBody');
  const S = DEMO.sherbot;

  const run = () => {
    const q = input.value.trim() || S.question;
    body.innerHTML = `
      <div class="sb-q"><span class="who2">PO</span><span>${q}</span></div>
      <div class="sb-a">
        <p>${S.summary}</p>
        <table>
          <thead><tr><th>Account</th><th>Retailer</th><th>Next band</th><th>Gap</th></tr></thead>
          <tbody>
            ${S.rows.map(r=>`<tr${r.account===DEMO.customer.account?' class="me"':''}>
              <td>${r.account}</td><td>${r.name}</td><td>${r.band}</td><td>${units(r.gap)}</td></tr>`).join('')}
          </tbody>
        </table>
        <p class="illus-note" style="margin-top:16px">
          <span class="illus"><i></i>Illustrative concept output</span><br>
          Stage 1 evidenced the SherBot interface, not a generated response. The answer above is
          written to show the shape of a reply and is not produced by a live model.
        </p>
      </div>`;
    body.scrollTop = 0;
  };

  form.addEventListener('submit', e=>{ e.preventDefault(); run(); });
  document.querySelectorAll('[data-prefill]').forEach(b=>
    b.addEventListener('click', ()=>{
      input.value = S.question;
      input.focus();
      /* focus parks the caret at the end, which scrolls a long question so it
         reads from the middle. Put it back to the start so the question is
         legible from the first word, whatever the language. */
      try{ input.setSelectionRange(0,0); }catch(e){}
      input.scrollLeft = 0;
    }));
  document.querySelectorAll('.sb-modes .pill').forEach(p=>
    p.addEventListener('click', ()=>{
      p.parentElement.querySelectorAll('.pill').forEach(x=>x.classList.remove('on'));
      p.classList.add('on');
    }));
}

/* ---------- boot -------------------------------------------- */
function boot(active, opts){
  if(typeof VON !== 'undefined') setTimeout(VON.boot, 0);
  mountChrome(active, opts);
  wireTabs(); wireAccordion(); wireCarousel();
  wireLedger(); wireAdminFilters(); wireSherbot();
  applyCampaignDetailPageData();
  openGameFromHash();
  wireReset();
  applyLang();
  window.addEventListener('load', applyLang);
}

/* ============================================================
   ENRICHMENT PASS
   ============================================================ */

/* ---------- campaign rail -----------------------------------
   The multi-card horizontal carousel already used in Équipe for
   the Newsfeed and Explore Rewards rails: arrows, snap points,
   native touch scrolling.
   ---------------------------------------------------------- */
function renderRail(mountId){
  const el = document.getElementById(mountId);
  if(!el) return;
  const cfg = window.CLIENT_CONFIG || {};
  const campaigns = (cfg.campaigns && cfg.campaigns.length) ? cfg.campaigns : DEMO.rail;

  const detailPages = ['first-time-fix.html', 'service-league.html', 'genuine-parts.html', 'ev-service-ready.html', 'next-service-booked.html'];

  el.innerHTML = campaigns.map((c, idx) => {
    const targetHref = c.href || detailPages[idx % detailPages.length];
    const isLink = targetHref && targetHref !== '#';
    const tag = isLink ? 'a' : 'button';
    const attr = isLink ? `href="${targetHref}"` : `type="button" data-modal="${c.id}"`;
    const imgPath = c.img || c.tileImage || 'assets/img/kv-test-drive.jpg';
    const cType = c.type || 'Incentive';
    return `<${tag} class="rcard" ${attr}>
      <span class="rcard-img">
        <img src="${imgPath}" alt="${c.name || ''}" loading="lazy">
        <span class="rcard-tag">${cType}</span>
        ${c.status ? `<span class="rcard-status">${c.status}</span>` : ''}
      </span>
      <span class="rcard-body">
        <h3>${c.name}</h3>
        <p>${c.blurb || ''}</p>
        <span class="go">${isLink ? 'Open campaign →' : 'Campaign summary →'}</span>
      </span>
    </${tag}>`;
  }).join('');
}

/* Campaigns with a page of their own. Derived, because a hardcoded count
   goes stale the moment a campaign is added and nobody notices. */
function liveCampaignCount(){
  return (DEMO.rail || []).filter(c => c.href && c.href !== '#').length;
}

function wireRail(){
  const el = document.querySelector('[data-crail]');
  if(!el) return;
  const prev = document.querySelector('[data-rail-prev]');
  const next = document.querySelector('[data-rail-next]');
  const step = () => {
    const first = el.querySelector('.rcard');
    return first ? first.getBoundingClientRect().width + 16 : 320;
  };
  const sync = () => {
    if(!prev || !next) return;
    prev.disabled = el.scrollLeft < 4;
    next.disabled = el.scrollLeft > el.scrollWidth - el.clientWidth - 4;
  };
  if(prev) prev.addEventListener('click', ()=>{ el.scrollBy({left:-step()*2, behavior:'smooth'}); });
  if(next) next.addEventListener('click', ()=>{ el.scrollBy({left: step()*2, behavior:'smooth'}); });
  el.addEventListener('scroll', sync, {passive:true});
  window.addEventListener('resize', sync);
  sync();
}

/* ---------- campaign summary modal -------------------------- */
function wireModals(){
  const host = document.getElementById('modalHost');
  if(!host) return;

  const close = () => { host.classList.remove('on'); document.body.style.overflow = ''; };

  const open = id => {
    const cfg = window.CLIENT_CONFIG || {};
    const pool = (cfg.campaigns && cfg.campaigns.length) ? cfg.campaigns : DEMO.rail;
    let c = pool.find(x => x.id === id) || DEMO.rail.find(x => x.id === id);
    if(!c) return;
    const modalLede = (c.modal && c.modal.lede) || c.blurb || '';
    const modalRows = (c.modal && c.modal.rows) || [['Type', c.type || 'Incentive'], ['Status', c.status || 'Active']];
    const modalNote = (c.modal && c.modal.note) || 'Campaign parameters configured for this client demo.';
    host.innerHTML = `
      <div class="modal-bg" data-close></div>
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="${c.name}">
        <button class="modal-close" data-close aria-label="Close">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9">
            <path d="M3 3l10 10M13 3L3 13"/></svg>
        </button>
        <div class="modal-hero">
          <span class="ctype"><i></i>${c.type || 'Incentive'}</span>
          <h3>${c.name}</h3>
          <p>${modalLede}</p>
        </div>
        <div class="modal-body">
          <table><tbody>
            ${modalRows.map(r => `<tr><th>${r[0]}</th><td>${r[1]}</td></tr>`).join('')}
          </tbody></table>
          <div class="modal-note">${modalNote}</div>
        </div>
        <div class="modal-foot">
          <span class="illus"><i></i>Illustrative campaign concept</span>
          <button class="btn btn-ghost" data-close>Close</button>
        </div>
      </div>`;
    host.classList.add('on');
    document.body.style.overflow = 'hidden';
    const btn = host.querySelector('.modal-close');
    if(btn) btn.focus();
  };

  document.addEventListener('click', e => {
    const t = e.target.closest('[data-modal]');
    if(t){ e.preventDefault(); open(t.dataset.modal); return; }
    if(e.target.closest('[data-close]')) close();
  });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') close(); });
}

/* ---------- reward catalogue -------------------------------- */
/* An OEM programme pays in points spent in the shop. No cash changes
   hands, so there is deliberately no cash-out or account-credit tile. */
function creditTile(){ return ''; }

/* Built-in icons for catalogue lines that have no brand artwork in the
   source screenshots. Same treatment as the credit-to-account tile, so
   nothing is traced, generated or upscaled. */
const RW_ICONS = {
  tool     : '<path d="M15 5.5a3.5 3.5 0 0 0-4.7 4.3l-5.7 5.7a2 2 0 0 0 2.8 2.8l5.7-5.7A3.5 3.5 0 0 0 18 8.5l-2.2 2.2-2.5-2.5z"/>',
  training : '<path d="M12 4L2 9l10 5 10-5z"/><path d="M6 11.5V16c0 1.7 2.7 3 6 3s6-1.3 6-3v-4.5"/>',
  equipment: '<path d="M3 20h18"/><path d="M6 20V10h12v10"/><path d="M9.5 10V5h5v5"/>',
  track    : '<path d="M6 21V3"/><path d="M6 4h11l-2.2 3.6L17 11H6z"/>',
  plant    : '<path d="M3 20V11l5 3V11l5 3V8l5 3v9z"/><path d="M2 20h20"/>',
  retail   : '<path d="M4 8h16l-1.2 11.2a1.6 1.6 0 0 1-1.6 1.4H6.8a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M8.6 8V6a3.4 3.4 0 0 1 6.8 0v2"/>',
  home     : '<path d="M3.5 10.5 12 3.5l8.5 7"/><path d="M5.6 9.2V20h12.8V9.2"/><path d="M9.8 20v-6h4.4v6"/>',
  dining   : '<path d="M6.5 3v8a2.5 2.5 0 0 0 5 0V3"/><path d="M9 11v10"/><path d="M17 3c-1.6 1.4-2.4 3.2-2.4 5.4 0 1.7.8 2.8 2.4 3.1V21"/>',
  travel   : '<path d="M2.5 15.5 21 9.6a1.9 1.9 0 0 0-1.2-3.6L15.8 7.3 9.4 3.6 7 4.4l4.2 4.6-3.8 1.2-2.8-1.7-1.8.6 2 3.4z"/><path d="M4 20h16"/>',
  ticket   : '<path d="M3 8.5V6.4h18v2.1a2.6 2.6 0 0 0 0 5.2v3.9H3v-3.9a2.6 2.6 0 0 0 0-5.2z"/><path d="M13.6 6.4v11.2"/>',
  tech     : '<rect x="2.6" y="4.4" width="18.8" height="12.4" rx="1.8"/><path d="M8 20.4h8"/>',
  sport    : '<circle cx="12" cy="12" r="8.6"/><path d="M12 3.4v17.2"/><path d="M3.6 9.4c3 2 5.8 2.9 8.4 2.9s5.4-.9 8.4-2.9"/>'
};

function rewardArt(r){
  if(r.img){
    const photo = r.t === 'Experiences' || r.t === 'Aspirational' || r.t === 'Team days' || r.t === 'Signature';
    return `<div class="rw-art${photo ? ' photo' : ''}">
      <img src="${r.img}" alt="${r.n}" loading="lazy"></div>`;
  }
  return `<div class="rw-art">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
         stroke-linejoin="round">${RW_ICONS[r.icon] || ''}</svg></div>`;
}

function renderRewards(mountId, opts){
  const el = document.getElementById(mountId);
  if(!el) return;
  opts = opts || {};
  const list = (opts.list || DEMO.rewards.concat(DEMO.experiences));
  const cards = list.map(r => `
    <div class="rw${r.t === 'Signature' ? ' sig' : ''}${r.img ? '' : ' icon'}">
      ${rewardArt(r)}
      <div class="rw-b">
        <div class="nm">${r.n}</div>
        <div class="mt">${r.note || r.t}</div>
        <div class="pr">${pts(r.p)} <span>points · ${ptsToCur(r.p)}</span></div>
      </div>
    </div>`).join('');
  el.innerHTML = (opts.credit === false ? '' : creditTile()) + cards;
}

/* ---------- recognition panel -------------------------------- */
function renderRecognition(mountId){
  const el = document.getElementById(mountId);
  if(!el) return;
  el.innerHTML = DEMO.recognition.winners.map(w => `
    <div class="recog-item">
      <div class="wn">${w.name}</div>
      <div class="wt">${w.town}</div>
      <p class="ww">${w.why}</p>
    </div>`).join('');
}

/* ---------- league table ------------------------------------- */
function movement(rank, prev){
  const d = prev - rank;
  if(d > 0) return `<span class="mv up"><svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0l5 8H0z"/></svg>${d}</span>`;
  if(d < 0) return `<span class="mv down"><svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor"><path d="M5 10L0 2h10z"/></svg>${-d}</span>`;
  return `<span class="mv same">—</span>`;
}

function renderLeague(mountId){
  const el = document.getElementById(mountId);
  if(!el) return;
  const L = DEMO.league;
  const row = (r, cls) => `
    <tr class="${cls || ''}">
      <td class="rk">${r.rank}</td>
      <td><span class="wsname">${r.name}</span><br><span class="wstown">${r.town}</span></td>
      ${r.s.map(v => `<td class="num">${v}</td>`).join('')}
      <td class="num tot">${r.total}</td>
      <td class="num">${r.prev}</td>
      <td class="num">${movement(r.rank, r.prev)}</td>
    </tr>`;
  el.innerHTML = `
    <table class="ltable">
      <thead><tr>
        <th>Rank</th><th>Retailer</th>
        ${L.metrics.map(m => `<th class="num">${m}</th>`).join('')}
        <th class="num">Total</th><th class="num">Prev</th><th class="num">Move</th>
      </tr></thead>
      <tbody>
        ${L.rows.map((r,i) => row(r, i === 0 ? 'lead' : '')).join('')}
        <tr class="lgap"><td colspan="${L.metrics.length + 5}">· · ·</td></tr>
        ${row(L.me, 'me')}
      </tbody>
    </table>`;
}

/* ---------- individual leaderboard ---------------------------
   Ranks people, not retailers. The retailer league answers a network
   manager's question; this one answers "am I doing well?", which
   is the question that makes somebody open the app on a Tuesday.

   Carries rank, previous rank, movement, the measure, points and
   the gap to the position above, because a leaderboard without a
   gap is a table. */
function renderIndividualLeague(mountId){
  const el = document.getElementById(mountId);
  if(!el) return;
  const L = DEMO.individualLeague;
  const rows = L.rows;
  const meIdx = rows.findIndex(r => r.me);
  const gapTo = i => (i > 0 ? rows[i-1].pts - rows[i].pts : null);

  el.innerHTML = `
    <table class="ltable ltable-ind">
      <thead><tr>
        <th>Rank</th><th>Participant</th><th>Retailer</th>
        <th class="num">${L.measure}</th>
        <th class="num">To next</th><th class="num">Prev</th><th class="num">Move</th>
      </tr></thead>
      <tbody>
        ${rows.map((r,i) => {
          const gap = gapTo(i);
          return `<tr class="${r.me ? 'me' : (i === 0 ? 'lead' : '')}"${r.me ? ' data-rm="rm-league-me"' : ''}>
            <td class="rk">${r.rank}</td>
            <td><span class="wsname">${r.name}</span><br><span class="wstown">${r.role}</span></td>
            <td><span class="wstown" style="font-size:13px">${r.site}</span></td>
            <td class="num tot">${pts(r.pts)}</td>
            <td class="num">${gap === null ? '—' : '+' + pts(gap)}</td>
            <td class="num">${r.prev}</td>
            <td class="num">${movement(r.rank, r.prev)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  return { me: rows[meIdx], gap: gapTo(meIdx), above: meIdx > 0 ? rows[meIdx-1] : null };
}

/* ---------- network adoption and drill-down ------------------
   United Kingdom -> region -> retailer -> individual, on one page.

   The level is held in the URL hash so a recording can jump straight to a
   depth and so the back button behaves. That also gives the automation a
   deterministic entry point for every level rather than a click sequence it
   has to get right.

   Every level renders the same funnel component from the same four numbers,
   so what a viewer learns nationally still reads two clicks down.
   ------------------------------------------------------------ */

/* target -> invited -> registered -> active, plus the two gaps that matter */
function funnelOf(o){
  return {
    target:       o.targetNetwork,
    invited:      o.invited,
    registered:   o.enrolled,
    active:       o.active,
    notRegistered: o.invited - o.enrolled,      /* derived, never stored */
    lapsed:        o.enrolled - o.active,       /* derived, never stored */
    regVsTarget:   Math.round(o.enrolled / o.targetNetwork * 100),
    activeVsReg:   Math.round(o.active / o.enrolled * 100),
    invitedVsTarget: Math.round(o.invited / o.targetNetwork * 100)
  };
}

function funnelHTML(f){
  const seg = (n, label, cls, pct) => `
    <div class="fn-step ${cls || ''}">
      <div class="fn-n">${pts(n)}</div>
      <div class="fn-l">${label}</div>
      ${pct !== undefined ? `<div class="fn-p">${pct}% of target</div>` : ''}
      <div class="fn-bar"><span style="width:${Math.round(n / f.target * 100)}%"></span></div>
    </div>`;
  return seg(f.target, 'Target network', 'is-target') +
         seg(f.invited, 'Invited', '', f.invitedVsTarget) +
         seg(f.registered, 'Registered', 'is-key', f.regVsTarget) +
         seg(f.active, 'Active this month', '', Math.round(f.active / f.target * 100));
}

function vsHTML(f){
  const tone = p => p >= 78 ? 'good' : p >= 68 ? 'mid' : 'poor';
  return `
    <div class="vs-tile ${tone(f.regVsTarget)}">
      <div class="vs-n">${f.regVsTarget}%</div>
      <div class="vs-l">Registration<br>vs target</div>
    </div>
    <div class="vs-tile ${tone(f.activeVsReg)}">
      <div class="vs-n">${f.activeVsReg}%</div>
      <div class="vs-l">Active<br>vs registered</div>
    </div>`;
}

/* one row in whichever table this level shows */
function drillRow(o, opts){
  const f = funnelOf(o);
  const tone = f.regVsTarget >= 78 ? 'good' : f.regVsTarget >= 68 ? 'mid' : 'poor';
  return `
    <button class="drow ${opts.clickable ? '' : 'flat'} ${opts.me ? 'me' : ''}"
            ${opts.clickable ? `data-drill="${opts.to}"` : 'disabled'}
            type="button">
      <span class="drow-name">${o.region || o.name}
        ${opts.sub ? `<span class="drow-sub">${opts.sub}</span>` : ''}</span>
      <span class="drow-bar" role="img" aria-label="registered against target">
        <span class="drow-fill ${tone}" style="width:${Math.min(100, f.regVsTarget)}%"></span>
        <span class="drow-tick" style="left:${Math.min(100, f.activeVsReg)}%"></span>
      </span>
      <span class="drow-figs">
        <b>${pts(f.registered)}</b><i>of ${pts(f.target)} target</i>
      </span>
      <span class="drow-pct ${tone}">${f.regVsTarget}%</span>
      <span class="drow-active">${pts(f.active)} active</span>
      ${opts.clickable ? '<span class="drow-go" aria-hidden="true">›</span>' : '<span class="drow-go dim" aria-hidden="true"></span>'}
    </button>`;
}

function personRow(p, prefix){
  const st = p.status === 'active'
    ? '<span class="pill on">Active</span>'
    : '<span class="pill">Registered, not active</span>';
  return `
    <button class="drow person ${p.me ? 'me' : ''}" type="button"
            ${p.me ? `data-drill="${prefix}/${encodeURIComponent(p.id)}"` : 'disabled'}>
      <span class="drow-name">${p.name}<span class="drow-sub">${p.role} · ${p.id}</span></span>
      <span class="drow-status">${st}</span>
      <span class="drow-figs"><b>${pts(p.pts)}</b><i>points this period</i></span>
      ${p.me ? '<span class="drow-go" aria-hidden="true">›</span>' : '<span class="drow-go dim" aria-hidden="true"></span>'}
    </button>`;
}

function renderNetwork(){
  const host = document.getElementById('drillRows');
  if(!host) return;
  const P = DEMO.programme, N = DEMO.network;

  const set = (id, v) => { const el = document.getElementById(id); if(el) el.innerHTML = v; };

  function draw(){
    const hash = (location.hash || '').replace('#','');
    const parts = hash ? hash.split('/') : [];
    const market = parts[0] ? decodeURIComponent(parts[0]) : null;
    const site   = parts[1] ? decodeURIComponent(parts[1]) : null;
    const person = parts[2] ? decodeURIComponent(parts[2]) : null;

    const crumb = [{ label:'United Kingdom', href:'#' }];
    let level, obj, rows = '', tableTitle = '', tableCount = '', note = '';

    const pv = document.getElementById('personView');
    pv.hidden = true; pv.innerHTML = '';
    document.querySelector('[data-rm="rm-drill-table"]').hidden = false;

    if(!market){
      level = 'europe';
      obj = { targetNetwork:P.targetNetwork, invited:P.invited, enrolled:P.enrolled, active:P.activeMonth };
      set('lvlTitle', 'XPENG UK');
      set('lvlSub', pts(P.regions) + ' regions · ' + pts(P.branches) + ' retailers · ' + DEMO.period);
      tableTitle = 'Adoption by region';
      tableCount = pts(P.regions) + ' regions';
      rows = P.regionRows.map(r => drillRow(r, {
        clickable: true, to: encodeURIComponent(r.region),
        sub: pts(r.sites) + ' retailers'
      })).join('');
      note = 'The bar is registration against target. The tick on it marks how many of those ' +
             'registered are active this month. Open a region to see its retailers.';
    }
    else if(market && !site){
      const m = P.regionRows.find(r => r.region === market);
      if(!m){ location.hash = ''; return; }
      level = 'market';
      obj = m;
      crumb.push({ label:m.region, href:'#' + encodeURIComponent(m.region) });
      set('lvlTitle', m.region);
      set('lvlSub', pts(m.sites) + ' retailers · ' + DEMO.period);
      const expanded = m.region === N.expandedRegion;
      tableTitle = expanded ? 'Adoption by retailer' : 'Retailers';
      tableCount = pts(m.sites) + ' retailers';
      rows = expanded
        ? N.sites.map(x => drillRow(x, {
            clickable: x.name === N.expandedSite, to: encodeURIComponent(m.region) + '/' + encodeURIComponent(x.name),
            sub: x.town, me: x.name === DEMO.customer.business
          })).join('')
        : `<div class="drill-empty">Site-level detail for ${m.region} is not part of this
             demonstration build. The United Kingdom is expanded to retailer and individual
             level and shows the depth the platform provides.
             <a class="link" href="#${encodeURIComponent(N.expandedRegion)}">Open the United Kingdom →</a></div>`;
      note = expanded
        ? 'Every retailer row sums to the region figures above: ' + pts(m.targetNetwork) + ' target, ' +
          pts(m.invited) + ' invited, ' + pts(m.enrolled) + ' registered, ' + pts(m.active) + ' active.'
        : '';
    }
    else if(site && !person){
      const m = P.regionRows.find(r => r.region === market);
      const sObj = N.sites.find(x => x.name === site);
      if(!m || !sObj){ location.hash = ''; return; }
      level = 'site';
      obj = sObj;
      crumb.push({ label:m.region, href:'#' + encodeURIComponent(m.region) });
      crumb.push({ label:sObj.name, href:'#' + encodeURIComponent(m.region) + '/' + encodeURIComponent(sObj.name) });
      set('lvlTitle', sObj.name);
      set('lvlSub', sObj.town + ' · ' + m.region + ' · ' + DEMO.period);
      tableTitle = 'People at this retailer';
      tableCount = pts(sObj.enrolled) + ' registered · ' + pts(sObj.active) + ' active';
      const prefix = encodeURIComponent(m.region) + '/' + encodeURIComponent(sObj.name);
      rows = N.people.map(x => personRow(x, prefix)).join('');
      note = 'Eleven registered and nine active, which is exactly the site row one level up. ' +
             'Open ' + DEMO.customer.owner + ' for the individual view.';
    }
    else {
      const m = P.regionRows.find(r => r.region === market);
      const sObj = N.sites.find(x => x.name === site);
      const pObj = N.people.find(x => x.id === person);
      if(!m || !sObj || !pObj){ location.hash = ''; return; }
      level = 'person';
      obj = sObj;
      crumb.push({ label:m.region, href:'#' + encodeURIComponent(m.region) });
      crumb.push({ label:sObj.name, href:'#' + encodeURIComponent(m.region) + '/' + encodeURIComponent(sObj.name) });
      crumb.push({ label:pObj.name, href:location.hash });
      document.querySelector('[data-rm="rm-drill-table"]').hidden = true;
      pv.hidden = false;
      pv.innerHTML = personViewHTML(pObj, sObj, m);
    }

    /* breadcrumb */
    set('drillCrumb', crumb.map((c,i) =>
      `<li>${i < crumb.length - 1
        ? `<a href="${c.href}">${c.label}</a>`
        : `<span aria-current="page">${c.label}</span>`}</li>`).join(''));

    /* funnel and the two headline ratios, at whatever level we are on */
    if(level !== 'person'){
      const f = funnelOf(obj);
      set('funnel', funnelHTML(f));
      set('lvlVs', vsHTML(f));
      set('funnelNote',
        pts(f.notRegistered) + ' invited but not yet registered · ' +
        pts(f.lapsed) + ' registered but not active this month');
      document.querySelector('[data-rm="rm-onboarding-funnel"]').hidden = false;
    } else {
      document.querySelector('[data-rm="rm-onboarding-funnel"]').hidden = true;
    }

    set('tableTitle', tableTitle);
    set('tableCount', tableCount);
    set('drillNote', note);
    host.innerHTML = rows;
    if(typeof applyLang === 'function') applyLang();
    window.scrollTo({ top:0, behavior:'auto' });
  }

  host.addEventListener('click', e => {
    const b = e.target.closest('[data-drill]');
    if(!b) return;
    location.hash = b.dataset.drill;
  });
  window.addEventListener('hashchange', draw);
  draw();
}

/* the individual view: the bottom of the drill, not a separate product */
function personViewHTML(p, site, market){
  const F = DEMO.firstTimeFix, G = DEMO.genuineParts, C = DEMO.certification, N = DEMO.nextService;
  const band = F.bands.filter(b => b.target <= F.unitsToDate).slice(-1)[0];
  const next = F.bands.find(b => b.target > F.unitsToDate);
  const il = DEMO.individualLeague, me = il.rows.find(r => r.me);

  const rows = [
    { name:'Test Drive',      type:'Accelerator',  now:F.unitsToDate, target:(next||band).target,
      unit:'jobs', earned:F.unitsToDate * band.rate },
    { name:'Order to Delivery',       type:'Conversion',   now:G.orders, target:Math.round(G.drives * G.networkRate / 100),
      unit:'orders from a drive', earned:G.orders * G.ratePerOrder },
    { name:'Product Certification',    type:'Certification',now:C.modules.filter(m=>m.done).length, target:C.modules.length,
      unit:'modules', earned:C.modules.filter(m=>m.done).length * C.perModule },
    { name:'Demonstrator Days', type:'Retention',    now:N.booked, target:Math.ceil(N.jobs * N.threshold / 100),
      unit:'booked', earned:N.award }
  ];

  const campaignRows = rows.map(r => {
    const pct = Math.round(r.now / r.target * 100);
    const tone = pct >= 100 ? 'good' : pct >= 85 ? 'mid' : 'poor';
    return `
      <tr>
        <td><b>${r.name}</b><br><span class="wstown">${r.type}</span></td>
        <td class="num">${r.now} ${r.unit}</td>
        <td class="num">${r.target}</td>
        <td class="num"><span class="achv ${tone}">${pct}%</span></td>
        <td class="num">${pts(r.earned)}</td>
      </tr>`;
  }).join('');

  return `
    <div class="split" data-rm="rm-person-view">
      <div class="panel">
        <div class="lvl-head" style="margin-bottom:18px">
          <div>
            <h2 class="h-sec">${p.name}</h2>
            <p class="sub" style="margin:0">${p.role} · ${site.name} · ${market.region} · ${p.id}</p>
          </div>
          <span class="pill on">Active since ${DEMO.customer.since}</span>
        </div>

        <div class="grid-4" style="margin-bottom:20px">
          <div class="kpi sm"><div class="n">${pts(p.pts)}</div><div class="c">points this period</div></div>
          <div class="kpi sm"><div class="n">${me.rank}<sup>${ordSuffix(me.rank)}</sup></div><div class="c">individual league, ${il.region}</div></div>
          <div class="kpi sm"><div class="n">${liveCampaignCount()}</div><div class="c">campaigns active</div></div>
          <div class="kpi sm"><div class="n">${pts(DEMO.points.balance)}</div><div class="c">points balance</div></div>
        </div>

        <div class="widget" style="padding:0">
          <div class="ptrack">
            <div class="ptrack-h">Performance by campaign</div>
            <table>
              <thead><tr><th>Campaign</th><th class="num">Position</th><th class="num">Target</th>
                <th class="num">Achievement</th><th class="num">Points</th></tr></thead>
              <tbody>${campaignRows}</tbody>
            </table>
          </div>
        </div>
        <p class="illus-note">Every figure here is the same figure the participant sees on their own
          campaign screens. Management is looking at one set of numbers, not a reporting copy.</p>
      </div>

      <aside class="rail">
        <div class="rail-dark">
          <div class="rail-h">Trend, last six periods</div>
          <div class="spark">${sparkHTML([388, 421, 402, 466, 497, p.pts])}</div>
          <div style="font-size:12.5px;color:var(--on-dark-dim);margin-top:10px">
            Points earned per period. Up in four of the last five.</div>
        </div>
        <div class="rail-dark">
          <div class="rail-h">Recent activity</div>
          ${DEMO.points.ledger.slice(0,4).map(l =>
            `<div class="rline"><span class="l">${l.date}<br>${l.label}</span>
             <span class="v">${l.pts > 0 ? '+' : ''}${pts(l.pts)}</span></div>`).join('')}
        </div>
        <div class="rail-photo"><img src="assets/img/showroom-desk.jpg" alt=""></div>
      </aside>
    </div>`;
}

function ordSuffix(n){ const s=['th','st','nd','rd'], v=n%100; return s[(v-20)%10] || s[v] || s[0]; }

/* a small inline trend, drawn rather than hovered: the brief rules out
   information that only exists on hover */
function sparkHTML(vals){
  const w = 240, h = 56, max = Math.max(...vals), min = Math.min(...vals) * 0.9;
  const x = i => i * (w / (vals.length - 1));
  const y = v => h - ((v - min) / (max - min)) * (h - 8) - 4;
  const pts2 = vals.map((v,i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:56px">
    <polyline points="0,${h} ${pts2} ${w},${h}" fill="rgba(63,210,230,.16)" stroke="none"/>
    <polyline points="${pts2}" fill="none" stroke="var(--citrus)" stroke-width="2.4"/>
    ${vals.map((v,i)=>`<circle cx="${x(i)}" cy="${y(v)}" r="${i===vals.length-1?4:2.6}"
      fill="${i===vals.length-1?'#fff':'var(--citrus)'}"/>`).join('')}
  </svg>`;
}

/* ---------- extend boot -------------------------------------- */
const _bootBase = boot;
boot = function(active, opts){
  _bootBase(active, opts);
  wireRail(); wireModals();
};

/* ---------- voucher wallet ---------------------------------- */
function renderWallet(mountId){
  const el = document.getElementById(mountId);
  if(!el) return;
  const credit = null;   /* no cash-out route on an OEM programme */
  const cards = DEMO.wallet.map(v => `
    <div class="vw${v.status === 'used' ? ' used' : ''}">
      <div class="vw-art">${v.img
        ? `<img src="${v.img}" alt="${v.name}" loading="lazy">`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"
                stroke-linejoin="round">${RW_ICONS[v.icon] || RW_ICONS.ticket}</svg>`}</div>
      <div class="vw-b">
        <div class="vw-top">
          <div>
            <div class="nm">${v.name}</div>
            <div class="mt">${pts(v.pts)} points redeemed</div>
          </div>
          <div class="val">${money(v.value)}</div>
        </div>
        <div class="vw-code">
          <span>${v.code}</span>
          <button type="button" onclick="return false">Copy</button>
        </div>
        <div class="vw-meta">
          <span>${v.status === 'used' ? 'Used ' + v.usedOn : 'Expires ' + v.expires}</span>
          <span class="vw-pill ${v.status}">${v.status === 'used' ? 'Used' : 'Ready to use'}</span>
        </div>
      </div>
    </div>`).join('');

  const creditCard = credit ? `
    <div class="vw credit">
      <div class="vw-art">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20"/><path d="M6.5 14.5h5"/></svg>
      </div>
      <div class="vw-b">
        <div class="vw-top">
          <div>
            <div class="nm">Credited to your balance</div>
            <div class="mt">${pts(Math.abs(credit.pts))} points converted</div>
          </div>
          <div class="val">${ptsToCur(credit.pts)}</div>
        </div>
        <div class="vw-code"><span>${DEMO.customer.account}</span></div>
        <div class="vw-meta">
          <span>Applied ${credit.date} 2026</span>
          <span class="vw-pill used" style="background:rgba(255,255,255,.16);color:#fff">On statement</span>
        </div>
      </div>
    </div>` : '';

  el.innerHTML = cards + creditCard;
}
