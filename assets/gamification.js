/* ============================================================
   Gamification module (Spin & Win / Scratchcard) — illustrative
   mechanics only. No real prizes, no real odds. Self-contained,
   works identically across all three demo builds.
   ============================================================ */
(function(){
  'use strict';

  function polar(cx, cy, r, angleDeg){
    const a = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  }

  function segmentPath(cx, cy, r, startAngle, endAngle){
    const p1 = polar(cx, cy, r, startAngle);
    const p2 = polar(cx, cy, r, endAngle);
    const large = (endAngle - startAngle) > 180 ? 1 : 0;
    return `M${cx} ${cy} L${p1.x.toFixed(2)} ${p1.y.toFixed(2)} A${r} ${r} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)} Z`;
  }

  /* ---------------- Spin & Win ---------------- */
  function spinWheel(opts){
    const wheelEl = document.querySelector(opts.wheelEl);
    const spinBtn = document.querySelector(opts.spinBtn);
    const resultEl = document.querySelector(opts.resultEl);
    const countEl = document.querySelector(opts.countEl);
    if(!wheelEl || !spinBtn) return;

    const prizes = opts.prizes || [];
    const n = prizes.length;
    const seg = 360 / n;
    const cx = 150, cy = 150, r = 148;
    const palette = ['var(--blue)','var(--citrus)','var(--blue-70)','var(--blue-30)'];

    let svg = `<svg viewBox="0 0 300 300" class="gg-wheel-svg" id="${opts.svgId||'ggWheelSvg'}">`;
    prizes.forEach((p, i) => {
      const start = i * seg, end = start + seg;
      const fill = palette[i % palette.length];
      svg += `<path d="${segmentPath(cx, cy, r, start, end)}" fill="${fill}" stroke="var(--white)" stroke-width="1.5"/>`;
      const mid = start + seg / 2;
      const labelPt = polar(cx, cy, r * 0.62, mid);
      svg += `<text x="${labelPt.x.toFixed(1)}" y="${labelPt.y.toFixed(1)}" text-anchor="middle" dominant-baseline="middle"
        transform="rotate(${mid.toFixed(1)} ${labelPt.x.toFixed(1)} ${labelPt.y.toFixed(1)})"
        font-size="12" font-weight="700" fill="#fff" font-family="var(--display)">${p.label}</text>`;
    });
    svg += `<circle class="gg-wheel-hub" cx="${cx}" cy="${cy}" r="20"/></svg>`;
    wheelEl.innerHTML = svg;
    const svgNode = wheelEl.querySelector('svg');

    let spinsLeft = opts.startSpins || 0;
    let rotation = 0;
    if(countEl) countEl.textContent = spinsLeft;

    function updateBtn(){
      spinBtn.disabled = spinsLeft <= 0;
      spinBtn.textContent = spinsLeft > 0 ? 'Spin the wheel' : 'No spins available';
    }
    updateBtn();

    spinBtn.addEventListener('click', function(){
      if(spinsLeft <= 0) return;
      spinsLeft -= 1;
      if(countEl) countEl.textContent = spinsLeft;
      spinBtn.disabled = true;
      if(resultEl){ resultEl.textContent=''; resultEl.classList.remove('show'); }

      const winIndex = Math.floor(Math.random() * n);
      // land the pointer (fixed at top) on the middle of winIndex segment
      const targetMid = winIndex * seg + seg / 2;
      const extraTurns = 4 + Math.floor(Math.random() * 2); // 4-5 full turns
      rotation = rotation - (rotation % 360) + extraTurns * 360 + (360 - targetMid);
      svgNode.style.transform = `rotate(${rotation}deg)`;

      setTimeout(function(){
        if(resultEl){
          resultEl.textContent = 'You won: ' + prizes[winIndex].label + ' — illustrative result, no real prize issued.';
          resultEl.classList.add('show');
        }
        updateBtn();
      }, 3700);
    });
  }

  /* ---------------- Scratchcard ---------------- */
  function scratchCard(opts){
    const canvas = document.getElementById(opts.canvasId);
    if(!canvas) return;
    const ctx = canvas.getContext('2d');
    const label = opts.label || 'Scratch here';

    function paintFoil(){
      const w = canvas.width, h = canvas.height;
      const grad = ctx.createLinearGradient(0,0,w,h);
      grad.addColorStop(0, '#B9C2C8');
      grad.addColorStop(.5, '#8E979D');
      grad.addColorStop(1, '#B9C2C8');
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = grad;
      ctx.fillRect(0,0,w,h);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.font = '700 13px var(--display), sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label.toUpperCase(), w/2, h/2);
    }
    paintFoil();

    let scratching = false;
    let revealed = false;
    let sampleCount = 0, clearCount = 0;

    function pos(e){
      const rect = canvas.getBoundingClientRect();
      const cx = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const cy = (e.touches ? e.touches[0].clientY : e.clientY) - rect.top;
      return { x: cx * (canvas.width / rect.width), y: cy * (canvas.height / rect.height) };
    }

    function scratchAt(x, y){
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    function checkCleared(){
      sampleCount++;
      if(sampleCount % 6 !== 0) return; // throttle the getImageData cost
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let transparent = 0;
      const step = 40; // sample every 10th pixel (4 channels)
      for(let i = 3; i < data.length; i += step){ if(data[i] < 40) transparent++; }
      const total = data.length / step;
      if(transparent / total > 0.45 && !revealed){
        revealed = true;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if(typeof opts.onReveal === 'function') opts.onReveal();
      }
    }

    function start(e){ scratching = true; const p = pos(e); scratchAt(p.x, p.y); e.preventDefault(); }
    function move(e){ if(!scratching || revealed) return; const p = pos(e); scratchAt(p.x, p.y); checkCleared(); e.preventDefault(); }
    function end(){ scratching = false; }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    canvas.addEventListener('touchstart', start, {passive:false});
    canvas.addEventListener('touchmove', move, {passive:false});
    canvas.addEventListener('touchend', end);

    if(opts.resetBtn){
      const btn = document.querySelector(opts.resetBtn);
      if(btn) btn.addEventListener('click', function(){ revealed = false; sampleCount = 0; paintFoil(); });
    }
  }

  /* ---------------- Match 3 ---------------- */
  var TILE_BLANK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M6 12h12"/></svg>';
  var TILE_BACK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">' +
    '<circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>' +
    '<path d="M12 8.4v-.3a2.6 2.6 0 1 1 3.5 2.4c-1 .4-1.5 1-1.5 2"/></svg>';

  function shuffle(arr){
    const a = arr.slice();
    for(let i = a.length - 1; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function matchThree(opts){
    const host = document.querySelector(opts.hostSel);
    const resultEl = document.querySelector(opts.resultSel);
    if(!host) return;
    const prize = opts.prize || {label: 'a prize'};
    const tileCount = opts.tileCount || 6;
    const starCount = opts.starCount || 3;
    let layout = [];
    for(let i = 0; i < tileCount; i++) layout.push(i < starCount);
    layout = shuffle(layout);

    host.innerHTML = layout.map(function(_, i){
      return '<button class="gg-match-tile" data-i="' + i + '" type="button" aria-label="Tile ' + (i+1) + '">' +
        '<span class="gg-match-face gg-match-back">' + TILE_BACK_SVG + '</span>' +
        '<span class="gg-match-face gg-match-front"></span></button>';
    }).join('');

    const tiles = Array.prototype.slice.call(host.querySelectorAll('.gg-match-tile'));
    let found = 0, done = false;
    if(resultEl){ resultEl.textContent = 'Find the ' + starCount + ' star tiles.'; }

    tiles.forEach(function(tile, i){
      tile.addEventListener('click', function(){
        if(done || tile.classList.contains('gg-match-open')) return;
        tile.classList.add('gg-match-open');
        const front = tile.querySelector('.gg-match-front');
        if(layout[i]){
          tile.classList.add('gg-match-star');
          front.innerHTML = STAR_SVG;
          tile.disabled = true;
          found++;
          if(found === starCount){
            done = true;
            tiles.forEach(function(t){ t.disabled = true; });
            if(resultEl){
              resultEl.textContent = 'Three stars matched — you won: ' + prize.label +
                ' — illustrative result, no real prize issued.';
              resultEl.classList.add('show');
            }
          } else if(resultEl){
            resultEl.textContent = found + ' of ' + starCount + ' found — keep going.';
          }
        } else {
          tile.classList.add('gg-match-blank');
          front.innerHTML = TILE_BLANK_SVG;
          tile.disabled = true;
        }
      });
    });
  }

  /* ---------------- Unlock the Badges ---------------- */
  var BADGE_LOCK_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">' +
    '<rect x="5" y="11" width="14" height="9" rx="1.6"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  var BADGE_DONE_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
    '<path d="M5 12.5l4.5 4.5L19 7"/></svg>';

  function unlockBadges(opts){
    const host = document.querySelector(opts.hostSel);
    const completeEl = opts.completeSel ? document.querySelector(opts.completeSel) : null;
    if(!host) return;
    const modules = opts.modules || [];
    host.innerHTML = modules.map(function(m, i){
      return '<div class="gg-badge" data-i="' + i + '">' +
        '<button class="gg-badge-ring" type="button" aria-label="Unlock ' + m.name + '">' + BADGE_LOCK_SVG + '</button>' +
        '<div class="gg-badge-name">' + m.name + '</div>' +
        '<div class="gg-badge-prize">' + m.prize + '</div></div>';
    }).join('');
    const rings = Array.prototype.slice.call(host.querySelectorAll('.gg-badge-ring'));
    let doneCount = 0;
    rings.forEach(function(ring, i){
      ring.addEventListener('click', function(){
        if(ring.classList.contains('gg-badge-done')) return;
        ring.classList.add('gg-badge-done');
        ring.innerHTML = BADGE_DONE_SVG;
        doneCount++;
        if(doneCount === modules.length && completeEl){
          completeEl.textContent = opts.completionText || 'All modules unlocked — completion bonus applied.';
          completeEl.classList.add('show');
        }
      });
    });
  }

  /* ---------------- Slots ---------------- */
  var STAR_SVG = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.9 6.6 7.1.7-5.4 4.7 1.7 7-6.3-3.8L5.7 21l1.7-7-5.4-4.7 7.1-.7z"/></svg>';
  var KEY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' +
    '<circle cx="8" cy="12" r="4.2"/><path d="M11.6 12h10M17.5 12v3.4M20.6 12v2.4"/></svg>';
  var TROPHY_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">' +
    '<path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 5H4v1.5A3.5 3.5 0 0 0 7.5 10M17 5h3v1.5A3.5 3.5 0 0 1 16.5 10"/>' +
    '<path d="M12 14v3M9 20h6M9.5 20c0-1.8.9-2.6 2.5-3 1.6.4 2.5 1.2 2.5 3"/></svg>';

  var SLOT_SYMBOLS = [
    {id:'key', svg: KEY_SVG},
    {id:'star', svg: STAR_SVG},
    {id:'trophy', svg: TROPHY_SVG}
  ];
  var TILE_H = 64; // must match .gg-reel-window height in gamification.css
  var STRIP_LOOPS = 6;

  function reelStripHtml(){
    let html = '';
    for(let l = 0; l < STRIP_LOOPS; l++){
      SLOT_SYMBOLS.forEach(function(s){ html += '<span class="gg-reel-cell">' + s.svg + '</span>'; });
    }
    return html;
  }

  function slotMachine(opts){
    const wrap = document.querySelector(opts.hostSel);
    const btn = document.querySelector(opts.btnSel);
    const resultEl = opts.resultSel ? document.querySelector(opts.resultSel) : null;
    if(!wrap || !btn) return;
    const prizeMap = opts.prizes || {}; // { key: '50 pts', star: '150 pts', trophy: '£20 voucher' }

    wrap.innerHTML = [0, 1, 2].map(function(i){
      return '<div class="gg-reel"><div class="gg-reel-window"><div class="gg-reel-strip" id="ggReelStrip' + i + '">' +
        reelStripHtml() + '</div></div></div>';
    }).join('');
    const strips = [0, 1, 2].map(function(i){ return document.getElementById('ggReelStrip' + i); });

    let spinning = false;

    function settle(strip, symbolIndex, delay, cb){
      setTimeout(function(){
        strip.classList.remove('gg-reel-spin');
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';
        requestAnimationFrame(function(){
          requestAnimationFrame(function(){
            const loop = STRIP_LOOPS - 2; // land within a loop near the end, motion still reads as "arriving"
            const offset = (loop * SLOT_SYMBOLS.length + symbolIndex) * TILE_H;
            strip.style.transition = 'transform .6s cubic-bezier(.17,.67,.32,1.1)';
            strip.style.transform = 'translateY(-' + offset + 'px)';
          });
        });
        if(cb) setTimeout(cb, 620);
      }, delay);
    }

    btn.addEventListener('click', function(){
      if(spinning) return;
      spinning = true;
      btn.disabled = true;
      if(resultEl){ resultEl.textContent = ''; resultEl.classList.remove('show'); }

      const winIndex = Math.floor(Math.random() * SLOT_SYMBOLS.length);
      strips.forEach(function(strip){
        strip.style.transition = 'none';
        strip.style.transform = 'translateY(0)';
        void strip.offsetWidth; // force reflow so the reset takes before spin starts
        strip.classList.add('gg-reel-spin');
      });

      settle(strips[0], winIndex, 700);
      settle(strips[1], winIndex, 1050);
      settle(strips[2], winIndex, 1450, function(){
        spinning = false;
        btn.disabled = false;
        const symbol = SLOT_SYMBOLS[winIndex];
        const label = prizeMap[symbol.id] || 'a reward';
        if(resultEl){
          resultEl.textContent = 'Three ' + symbol.id + 's — you won: ' + label +
            ' — illustrative result, no real prize issued.';
          resultEl.classList.add('show');
        }
      });
    });
  }

  /* ---------------- Quiz unlock ---------------- */
  function quizUnlock(opts){
    const optsHost = document.querySelector(opts.hostSel);
    const qEl = opts.questionSel ? document.querySelector(opts.questionSel) : null;
    const resultEl = opts.resultSel ? document.querySelector(opts.resultSel) : null;
    if(!optsHost) return;
    const q = opts.question || {};
    const prize = opts.prize || {label: 'a prize'};
    const answers = q.options || [];
    const correctIndex = typeof q.correctIndex === 'number' ? q.correctIndex : 0;

    if(qEl) qEl.textContent = q.text || '';
    optsHost.innerHTML = answers.map(function(a, i){
      return '<button class="gg-quiz-opt" type="button" data-i="' + i + '">' + a + '</button>';
    }).join('');

    const buttons = Array.prototype.slice.call(optsHost.querySelectorAll('.gg-quiz-opt'));
    let solved = false;
    if(resultEl){ resultEl.textContent = 'Pick an answer to see if you unlock the reward.'; }

    buttons.forEach(function(btn, i){
      btn.addEventListener('click', function(){
        if(solved || btn.disabled) return;
        if(i === correctIndex){
          solved = true;
          btn.classList.add('gg-quiz-correct');
          buttons.forEach(function(b){ b.disabled = true; });
          if(resultEl){
            resultEl.textContent = 'Correct — you unlocked: ' + prize.label +
              ' — illustrative result, no real prize issued.';
            resultEl.classList.add('show');
          }
        } else {
          btn.classList.add('gg-quiz-wrong');
          btn.disabled = true;
          if(resultEl && !solved){ resultEl.textContent = 'Not quite — one more guess.'; }
        }
      });
    });
  }

  window.GG = {
    spinWheel: spinWheel, scratchCard: scratchCard,
    matchThree: matchThree, unlockBadges: unlockBadges, slotMachine: slotMachine,
    quizUnlock: quizUnlock
  };
})();
