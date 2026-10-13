const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');

function fixture() {
  const nodes = [];
  const attributes = [];
  let lang = 'en';
  let observer;
  const context = vm.createContext({
    window: { CLIENT_CONFIG: {
      clientName: 'Renault', platformName: 'Pulse', tagline: 'Drive Passion',
      country: { name: 'Romania', code: 'RO', currency: 'RON', symbol: 'RON' }
    } },
    localStorage: { getItem: () => lang, setItem: (_, value) => { lang = value; } },
    NodeFilter: { SHOW_TEXT: 4 },
    MutationObserver: class {
      constructor(callback) { observer = callback; }
      disconnect() {}
      observe() {}
    },
    document: {
      documentElement: {},
      createTreeWalker() { let i = 0; return { nextNode: () => nodes[i++] }; },
      querySelectorAll(selector) { return selector.startsWith('[placeholder]') ? attributes : []; }
    }
  });
  for (const filename of ['i18n-core.js', 'i18n-build.js', 'data.js', 'app.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../master-template/assets', filename), 'utf8'), context);
  }
  return {
    context, nodes, attributes,
    run: code => vm.runInContext(code, context),
    update: () => observer(),
    node(text, skipped = false) {
      const node = { textContent: text, parentElement: { closest: () => skipped } };
      nodes.push(node);
      return node;
    }
  };
}

test('client, programme, country and money use the entered configuration', () => {
  const f = fixture();
  assert.equal(f.run("clientText('XPENG Vector / XPENG UK / United Kingdom / GBP / \\u00a325')"),
    'Renault Pulse / Renault RO / Romania / RON / RON25');
  assert.equal(f.run('money(1250)'), 'RON1,250');
  assert.equal(f.run('ptsToCur(25)'), 'RON25');
  f.run("window.CLIENT_CONFIG.clientName = 'XPENG'; window.CLIENT_CONFIG.country.symbol = '$'");
  assert.equal(f.run("clientText('XPENG UK \\u00a325')"), 'XPENG RO $25');
});

test('rendering stays stable, translates originals, and accepts later content updates', () => {
  const f = fixture();
  const title = f.node('XPENG Vector - Shop');
  const country = f.node('United Kingdom');
  const reward = f.node('XPENG UK: \u00a325');
  const script = f.node('assets/xpeng-logo.png XPENG UK', true);
  const attr = { values: { alt: 'XPENG UK', src: 'assets/xpeng-logo.png' },
    hasAttribute(key) { return key in this.values; },
    getAttribute(key) { return this.values[key]; },
    setAttribute(key, value) { this.values[key] = value; } };
  f.attributes.push(attr);
  f.run('applyLang(); applyLang()');
  assert.equal(title.textContent, 'Renault Pulse - Shop');
  assert.equal(country.textContent, 'Romania');
  assert.equal(reward.textContent, 'Renault RO: RON25');
  assert.equal(attr.values.alt, 'Renault RO');
  assert.equal(attr.values.src, 'assets/xpeng-logo.png');
  assert.equal(script.textContent, 'assets/xpeng-logo.png XPENG UK');
  for (const lang of ['de', 'nl', 'fr', 'pl', 'en']) {
    f.run(`setLang('${lang}')`);
    assert.equal(country.textContent, 'Romania');
  }
  reward.textContent = 'XPENG UK: \u00a350';
  f.update();
  assert.equal(reward.textContent, 'Renault RO: RON50');
  const modal = f.node('XPENG UK: \u00a375');
  f.update();
  assert.equal(modal.textContent, 'Renault RO: RON75');
});

test('replacement strings are literal and are not recursively expanded', () => {
  const f = fixture();
  f.run("window.CLIENT_CONFIG.clientName = 'XPENG Partners $&'; window.CLIENT_CONFIG.platformName = 'Vector Plus'");
  const text = f.node('XPENG Vector');
  f.run('applyLang(); applyLang()');
  assert.equal(text.textContent, 'XPENG Partners $& Vector Plus');
});


test('campaign detail uses the selected campaign and actual template fields', () => {
  const f = fixture();
  const nodes = {};
  for (const key of ['h1', 'lede', 'image', 'type', 'status']) nodes[key] = {};
  f.context.location = { pathname: '/preview/campaign-7.html' };
  f.context.window.CLIENT_CONFIG.campaigns = [
    { href: 'campaign-1.html', name: 'First campaign' },
    { href: 'campaign-7.html', name: '<Custom title>', blurb: 'Entered description',
      type: 'Custom incentive', img: 'assets/custom.png', status: 'Active' }
  ];
  f.context.document.querySelector = selector => {
    if (selector.includes('h1')) return nodes.h1;
    if (selector.includes('.cam-lede')) return nodes.lede;
    if (selector.includes('.keyvis img')) return nodes.image;
    if (selector.includes('.ctype')) return nodes.type;
    if (selector === '.keyvis-meta') return nodes.status;
    return null;
  };
  f.run('applyCampaignDetailPageData()');
  assert.equal(nodes.h1.textContent, '<Custom title>');
  assert.equal(nodes.lede.textContent, 'Entered description');
  assert.equal(nodes.image.src, 'assets/custom.png');
  assert.equal(nodes.type.textContent, 'Custom incentive');
  assert.equal(nodes.status.textContent, 'Active');
  assert.equal(f.context.document.title, 'Renault Pulse \u2014 <Custom title>');
});
