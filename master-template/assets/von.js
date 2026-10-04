/* ==========================================================================
   VOICE OF THE NETWORK / NETWORK INTELLIGENCE — master module.

   One file, dropped into any Sherbet demo build, reading one config block
   (DEMO.von). Nothing about a prospect, a market, a function or a competitor
   is written here: if it is not in config it does not render, and the module
   says so on screen rather than inventing a plausible substitute. That rule
   is the whole point. A module that guesses at competitor names would put
   Tesla in front of a manufacturer that never loses to Tesla.

   THREE THINGS ARE NOT CONFIGURABLE, DELIBERATELY:

   1. The COMING SOON badge. It renders unconditionally on both the
      participant and the management side. There is no flag to remove it,
      because the one failure that actually costs money is a prospect
      believing this ships today.
   2. The interaction architecture. One question, one tap, one sentence,
      in that order. Content varies per prospect; shape does not.
   3. The recording is simulated. This module captures no audio, requests
      no microphone permission and transcribes nothing. The waveform is a
      fixed sequence, not a signal, so every recording of the demo produces
      an identical frame.

   Depends on nothing. No build step. Load after data.js, before boot().
   ========================================================================== */

(function (global) {
  'use strict';

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function mount(id) { return document.getElementById(id); }

  /* data.js declares `const DEMO`, which is a lexical global and never becomes
     a property of window. Reading global.DEMO therefore always came back
     undefined and every panel rendered its own build error. Cost one render
     to find. Read the binding the same way the rest of the runtime does. */
  function cfg() {
    try { return (typeof DEMO !== 'undefined' && DEMO && DEMO.von) ? DEMO.von : null; }
    catch (e) { return null; }
  }

  /* A missing config section is a build error, and it should look like one.
     Silence here would ship a demo with a hole in it that nobody noticed
     until it was on a prospect's screen. */
  function missing(el, what) {
    el.innerHTML = '<div style="border:1px dashed #C0392B;color:#C0392B;border-radius:10px;'
      + 'padding:14px 16px;font-size:13px;font-weight:600">'
      + 'Voice of the Network: <code>' + esc(what) + '</code> is not configured for this build.'
      + '</div>';
    if (global.console) console.error('[von] missing config: ' + what);
    return false;
  }

  function badge(cfg, onDark) {
    var label = (cfg && cfg.status) || 'Coming soon';
    return '<span class="von-soon' + (onDark ? ' on-dark' : '') + '"><i></i>' + esc(label) + '</span>';
  }

  /* Fixed, not random. The video recorder screenshots this frame and two
     runs have to produce identical pixels. */
  var WAVE = [8, 17, 29, 13, 25, 34, 19, 10, 24, 36, 21, 12, 27, 16, 31, 14,
              22, 9, 18, 26, 12, 20, 7, 15, 24, 11, 17, 6];

  function waveHTML() {
    return WAVE.map(function (h) { return '<i style="height:' + h + 'px"></i>'; }).join('');
  }

  function markHTML(cfg) {
    return '<span class="von-mark">'
      + '<span class="wave"><i style="height:5px"></i><i style="height:10px"></i>'
      + '<i style="height:6px"></i><i style="height:12px"></i></span>'
      + esc(cfg.brandLabel || 'Voice of the Network') + '</span>';
  }

  /* ======================================================================
     PARTICIPANT — the hero. One question, offered at a moment that earned
     it, with the two follow-on states shown alongside so the whole
     interaction reads in a single screen.
     ====================================================================== */
  function cfgOf(el) { var c = cfg(); if (!c) { missing(el, 'DEMO.von'); return null; } return c; }

  function participant(mountId) {
    var el = mount(mountId); if (!el) return false;
    var cfg = cfgOf(el); if (!cfg) return false;
    if (!cfg.question) return missing(el, 'DEMO.von.question');
    if (!cfg.options || !cfg.options.length) return missing(el, 'DEMO.von.options');
    if (!cfg.trigger) return missing(el, 'DEMO.von.trigger');

    var t = cfg.trigger;
    var cl = cfg.classify || null;
    var rc = cfg.recording || null;

    var taps = cfg.options.map(function (o) {
      var on = (o === cfg.preselect) ? ' on' : '';
      return '<span class="von-tap' + on + '">' + esc(o) + '</span>';
    }).join('');

    var step2 = '';
    if (cl && cl.options && cl.options.length) {
      step2 = '<div class="von-step">'
        + '<span class="k">' + esc(cl.label || 'One tap') + '</span>'
        + '<div class="sq">' + esc(cl.question || '') + '</div>'
        + '<div class="von-taps">'
        + cl.options.map(function (o) {
            return '<span class="von-tap' + (o === cl.preselect ? ' on' : '') + '">' + esc(o) + '</span>';
          }).join('')
        + '</div></div>';
    }

    var step3 = '';
    if (rc) {
      step3 = '<div class="von-step">'
        + '<span class="k">' + esc(rc.label || 'One sentence') + '</span>'
        + '<div class="von-rec-state">'
        + '<span class="von-live"><span class="dot"></span>Recording</span>'
        + '<span class="von-time">' + esc(rc.time || '00:06') + '</span>'
        + '<span class="von-wave">' + waveHTML() + '</span>'
        + '</div>'
        + (rc.transcript ? '<div class="von-said">' + esc(rc.transcript) + '</div>' : '')
        + '<span class="von-send">' + esc(rc.stop || 'Stop &amp; send') + '</span>'
        + '<span class="von-cancel">Cancel</span>'
        + '</div>';
    }

    el.innerHTML =
      '<div class="von" data-rm="rm-von-prompt">'
      + '<div class="von-head">' + markHTML(cfg) + badge(cfg, true) + '</div>'
      + '<div class="von-why">'
      +   '<span class="amt">' + esc(t.amount || '') + '</span>'
      +   '<span class="txt"><b>' + esc(t.label || '') + '</b>'
      +   (t.sub ? ' · ' + esc(t.sub) : '') + '</span>'
      + '</div>'
      + '<h2 class="von-q">' + esc(cfg.question) + '</h2>'
      + '<div class="von-taps">' + taps + '</div>'
      + '<div class="von-acts">'
      +   '<button class="von-rec" type="button" disabled>'
      +     '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
      +     'stroke-width="2" stroke-linecap="round"><rect x="9" y="2" width="6" height="11" rx="3"/>'
      +     '<path d="M5 11a7 7 0 0014 0M12 18v3"/></svg>'
      +     esc(cfg.record || 'Record audio') + '</button>'
      +   '<button class="von-type" type="button" disabled>' + esc(cfg.type || 'Type a few words') + '</button>'
      + '</div>'
      + ((step2 || step3) ? '<div class="von-steps">' + step3 + step2 + '</div>' : '')
      + (cfg.footnote ? '<p class="von-foot">' + esc(cfg.footnote) + '</p>' : '')
      + '</div>';
    return true;
  }

  /* ======================================================================
     PARTICIPANT — the always-available route. Architecturally retained,
     visually secondary. The post-outcome prompt is the hero because Sherbet
     already knows the participant and the outcome; this one knows neither
     until it is told.
     ====================================================================== */
  function open(mountId) {
    var el = mount(mountId); if (!el) return false;
    var cfg = cfgOf(el); if (!cfg) return false;
    var a = cfg.always;
    if (!a || !a.categories || !a.categories.length) { el.innerHTML = ''; return false; }

    el.innerHTML =
      '<div class="von-open" data-rm="rm-von-open">'
      + '<div class="von-open-h"><h3>' + esc(a.label || "Tell us what you're seeing") + '</h3>'
      + badge(cfg, false) + '</div>'
      + '<p class="von-open-s">' + esc(a.sub || 'Any time, not only after a result.') + '</p>'
      + '<div class="von-cats">'
      + a.categories.map(function (c) {
          return '<button class="von-cat" type="button" disabled>'
            + '<span class="t">' + esc(c.t) + '</span>'
            + (c.s ? '<span class="s">' + esc(c.s) + '</span>' : '')
            + '</button>';
        }).join('')
      + '</div></div>';
    return true;
  }

  /* ======================================================================
     MANAGEMENT — Network Intelligence. The other side of the same
     capability: what the frontline capture becomes once there is enough of
     it to aggregate.
     ====================================================================== */
  function intelligence(mountId) {
    var el = mount(mountId); if (!el) return false;
    var cfg = cfgOf(el); if (!cfg) return false;
    var ni = cfg.intelligence;
    if (!ni) return missing(el, 'DEMO.von.intelligence');
    if (!ni.signals || !ni.signals.length) return missing(el, 'DEMO.von.intelligence.signals');

    var layers = ni.layers || [
      { n: '1', t: 'What people are doing', s: 'Engagement, participation and adoption. Already here.' },
      { n: '2', t: 'What happened', s: 'Outcomes, campaign results and reward claims. Already here.' },
      { n: '3', t: 'Why it happened', s: 'The frontline explanation. This is the layer that is new.', isNew: true }
    ];

    el.innerHTML =
      '<div class="ni" data-rm="rm-ni-panel">'
      + '<div class="ni-h"><h2>' + esc(ni.headline || 'What your network is telling you') + '</h2>'
      + badge({ status: ni.status || cfg.status }, true) + '</div>'
      + '<p class="ni-s">' + esc(ni.basis || '') + '</p>'
      + '<div class="ni-grid">'
      + ni.signals.map(function (s) {
          return '<div class="ni-sig"><span class="k">' + esc(s.k) + '</span>'
            + '<span class="v">' + esc(s.v) + '</span></div>';
        }).join('')
      + '</div>'
      + (ni.recommendation
          ? '<div class="ni-rec"><span class="lab">Recommendation</span><p>'
            + esc(ni.recommendation) + '</p></div>'
          : '')
      + '<div class="ni-layers">'
      + layers.map(function (l) {
          return '<div class="ni-layer' + (l.isNew ? ' new' : '') + '">'
            + '<span class="n">Layer ' + esc(l.n) + (l.isNew ? ' · new' : '') + '</span>'
            + '<span class="t">' + esc(l.t) + '</span>'
            + '<span class="s">' + esc(l.s) + '</span></div>';
        }).join('')
      + '</div></div>';
    return true;
  }

  /* Mount whatever is present on the page. Safe to call on every page. */
  function boot() {
    if (document.getElementById('vonPrompt')) participant('vonPrompt');
    if (document.getElementById('vonOpen')) open('vonOpen');
    if (document.getElementById('niPanel')) intelligence('niPanel');
  }

  global.VON = {
    participant: participant,
    open: open,
    intelligence: intelligence,
    boot: boot,
    /* exposed so a build's verify.js can assert the badge cannot be switched off */
    ALWAYS_COMING_SOON: true
  };
})(window);
