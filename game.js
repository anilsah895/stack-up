(function () {
  // ---------- Config ----------
  var DEVELOPER = 'Anil Kumar Sah'; // TODO: set your publisher/developer name (required by Playables design rules)
  var RM = false; try { RM = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { }
  var W = 360, BH = 26, BASEW = 190, TOL = 5, GROUND = 70;
  // Prayer-flag colours: blue, white, red, green, yellow
  var PAL = ['#2f6fe0', '#f4f1e8', '#e0382f', '#2fa24f', '#f5c518'];
  var cv = document.getElementById('c'), ctx = cv.getContext('2d');
  var vw = 0, vh = 0, sc = 1, dpr = 1, ox = 0;

  // ---------- Playables SDK (safe when absent) ----------
  var yt = (typeof ytgame !== 'undefined') ? ytgame : null, inYT = !!(yt && yt.IN_PLAYABLES_ENV);
  var audioOn = true, paused = false, raf = 0, last = 0, ac = null;
  function sdk(fn) { try { if (yt) fn(yt); } catch (e) { } }
  function guard(p) { try { Promise.resolve(p).catch(function () { }); } catch (e) { } }
  function muteNow() { try { if (ac && ac.state === 'running') ac.suspend(); } catch (e) { } }
  function doPause() {
    if (paused) return; paused = true;
    if (raf) { cancelAnimationFrame(raf); raf = 0; }   // pause ALL execution
    saveBest(); muteNow(); draw();
    if (vw) { ctx.fillStyle = 'rgba(12,16,44,.6)'; ctx.fillRect(-ox, 0, W + ox * 2, vh); text('Paused', W / 2, vh / 2, 36, '#f6f1e4'); }
  }
  function doResume() {
    if (!paused) return; paused = false; last = performance.now();
    if (!raf) raf = requestAnimationFrame(frame);
  }
  sdk(function (y) {
    if (inYT) {
      try { audioOn = !!y.system.isAudioEnabled(); } catch (e) { console.warn('SDK isAudioEnabled failed:', e); }
      try {
        y.system.onAudioEnabledChange(function (v) { audioOn = !!v; if (!audioOn) muteNow(); });
      } catch (e) { console.warn('SDK onAudioEnabledChange failed:', e); }
    }
    y.system.onPause(doPause); y.system.onResume(doResume);
  });

  // ---------- Save (SDK inside YouTube, localStorage elsewhere; stored data is untrusted) ----------
  var best = 0;
  function acceptBest(v) { v = +v; if (isFinite(v) && v >= 0 && v <= 1e6) best = Math.max(best, Math.floor(v)); }
  function loadBest(done) {
    var fin = false; function end() { if (!fin) { fin = true; if (done) done(); } }
    if (inYT) {
      try {
        Promise.resolve(yt.game.loadData()).then(function (s) {
          if (s) { var o = JSON.parse(s); if (o && typeof o === 'object') acceptBest(o.best); }
        }).catch(function () { }).then(end);
      } catch (e) { end(); }
      setTimeout(end, 1500);
    } else {
      try { acceptBest(localStorage.getItem('stackup-best')); } catch (e) { }
      end();
    }
  }
  function saveBest() {
    var s = JSON.stringify({ best: best });
    if (inYT) { try { guard(yt.game.saveData(s)); } catch (e) { } }
    else { try { localStorage.setItem('stackup-best', String(best)); } catch (e) { } }
  }

  // ---------- Audio (created on first gesture) ----------
  function ensureAudioContext() {
    if (!ac) { try { var AudioCtx = window.AudioContext || window.webkitAudioContext; if (AudioCtx) ac = new AudioCtx(); } catch (e) { } }
    if (ac && ac.state === 'suspended') { try { ac.resume().catch(function () { }); } catch (e) { } }
    return ac;
  }

  function beep(f, d, type, vol, fEnd) {
    if (!audioOn || paused) return;
    try {
      var ctx = ensureAudioContext();
      if (!ctx) return;
      var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
      o.type = type || 'sine';
      o.frequency.setValueAtTime(f, t);
      if (fEnd) o.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t + d);
      var v = vol || 0.12;
      g.gain.setValueAtTime(v, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + d);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // ---------- Game state ----------
  var state = 'ready', blocks, cur, debris, pops, combo, score, cam, camT, overAt, flash, skyP = 0, rings = [], stars = [];
  function reset() {
    blocks = [{ x: (W - BASEW) / 2, w: BASEW }];
    debris = []; pops = []; rings = []; skyP = 0; combo = 0; score = 0; cam = 0; camT = 0; flash = 0;
    spawn();
  }
  function spawn() {
    var n = blocks.length, top = blocks[n - 1], dir = n % 2 ? 1 : -1;
    cur = { x: dir > 0 ? -top.w : W, w: top.w, dir: dir, i: n };
  }
  function speed() { return Math.min(120 + score * 5, 300); }
  function wy(i) { return i * BH; }
  function sy(w) { return vh - GROUND - w - BH + cam; }

  function tap() {
    if (paused) return;
    var now = performance.now();
    if (state === 'ready') { state = 'play'; beep(520, .08, 'triangle'); return; }
    if (state === 'over') { if (now - overAt > 220) { reset(); state = 'play'; beep(520, .08, 'triangle'); } return; }
    var top = blocks[blocks.length - 1];
    var lo = Math.max(cur.x, top.x), hi = Math.min(cur.x + cur.w, top.x + top.w), ov = hi - lo;
    if (ov <= 0) { // miss
      debris.push({ x: cur.x, w: cur.w, y: wy(cur.i), vy: 0, c: PAL[cur.i % 5] });
      endGame(); return;
    }
    var perfect = Math.abs(cur.x - top.x) <= TOL;
    if (perfect) {
      combo++; cur.x = top.x;
      if (combo >= 3) cur.w = Math.min(cur.w + 8, BASEW);
      flash = RM ? 0 : 1; rings.push({ x: cur.x, y: wy(cur.i), w: cur.w, a: 1, g: 0 }); pops.length = 0; pops.push({ t: combo > 1 ? 'Perfect x' + combo : 'Perfect', y: wy(cur.i), a: 1 });
      beep(520 + combo * 70, .18, 'triangle', .14);
    } else {
      combo = 0;
      if (cur.x < top.x) debris.push({ x: cur.x, w: top.x - cur.x, y: wy(cur.i), vy: 0, c: PAL[cur.i % 5] });
      else debris.push({ x: top.x + top.w, w: cur.x + cur.w - (top.x + top.w), y: wy(cur.i), vy: 0, c: PAL[cur.i % 5] });
      cur.x = lo; cur.w = ov;
      beep(260, .1, 'square', .06);
    }
    blocks.push({ x: cur.x, w: cur.w }); score = blocks.length - 1;
    camT = Math.max(0, (blocks.length + 1) * BH + GROUND - vh * .6);
    spawn();
  }
  function endGame() {
    state = 'over'; overAt = performance.now();
    var nb = score > best; if (nb) { best = score; saveBest(); }
    sdk(function (y) { guard(y.engagement.sendScore({ value: score })); });
    over = { nb: nb };
    if (nb) {
      beep(520, .1, 'triangle', .12);
      setTimeout(function () { beep(650, .1, 'triangle', .14); }, 90);
      setTimeout(function () { beep(780, .25, 'triangle', .16); }, 180);
    } else {
      beep(150, .5, 'sawtooth', .1, 60);
    }
  }
  var over = { nb: false };

  // ---------- Layout (safe when viewport is 0) ----------
  function resize() {
    var w = window.innerWidth, h = window.innerHeight;
    if (!w || !h) return;           // hidden WebView starts at 0x0
    dpr = Math.min(window.devicePixelRatio || 1, 3);
    vw = w; vh = h; sc = Math.min(w / W, h / 600); ox = (w / sc - W) / 2; vh = h / sc; vw = W;
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    stars = []; for (var i = 0; i < 40; i++) stars.push({ x: -ox + Math.random() * (W + ox * 2), y: Math.random() * vh, r: Math.random() * 1.2 + .3 });
  }
  window.addEventListener('resize', resize);

  // ---------- Drawing ----------
  var SKY = [[[15, 26, 58], [58, 47, 116]], [[43, 47, 107], [224, 98, 122]], [[74, 112, 214], [247, 194, 122]]];
  function mix(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  function rgb(c, a) { return 'rgba(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ',' + (a == null ? 1 : a) + ')'; }
  function hex(c) { return [parseInt(c.substr(1, 2), 16), parseInt(c.substr(3, 2), 16), parseInt(c.substr(5, 2), 16)]; }
  var SH = {}; PAL.forEach(function (c) { var r = hex(c); SH[c] = { top: rgb(mix(r, [255, 255, 255], .3)), side: rgb(mix(r, [0, 0, 0], .32)) }; });
  function sky() { var p = Math.min(skyP / 45, 1) * 2, i = Math.min(p | 0, 1), t = p - i; return [mix(SKY[i][0], SKY[i + 1][0], t), mix(SKY[i][1], SKY[i + 1][1], t)]; }
  function ridge(pts, base, col, snow) {
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-ox - 2, vh + 300); ctx.lineTo(-ox - 2, base - pts[0][1]);
    pts.forEach(function (p) { ctx.lineTo(p[0], base - p[1]); });
    ctx.lineTo(W + ox + 2, base - pts[pts.length - 1][1]); ctx.lineTo(W + ox + 2, vh + 300); ctx.fill();
    if (!snow) return;
    ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (var i = 1; i < pts.length - 1; i++) {
      var p = pts[i], l = pts[i - 1], r = pts[i + 1]; if (p[1] < l[1] || p[1] < r[1] || p[1] < 100) continue;
      var sl = (p[1] - l[1]) / (p[0] - l[0]), sr = (p[1] - r[1]) / (r[0] - p[0]), h = 20, y = base - p[1];
      ctx.beginPath(); ctx.moveTo(p[0], y); ctx.lineTo(p[0] + h / sr, y + h); ctx.lineTo(p[0] + h / sr * .4, y + h * .7);
      ctx.lineTo(p[0], y + h * 1.05); ctx.lineTo(p[0] - h / sl * .4, y + h * .7); ctx.lineTo(p[0] - h / sl, y + h); ctx.fill();
    }
  }
  function drawBg() {
    var s = sky(), prog = Math.min(skyP / 45, 1), g = ctx.createLinearGradient(0, 0, 0, vh);
    g.addColorStop(0, rgb(s[0])); g.addColorStop(1, rgb(s[1]));
    ctx.fillStyle = g; ctx.fillRect(-ox - 2, 0, W + ox * 2 + 4, vh);
    var sx = 275, sy2 = 150 + cam * .12, gl = ctx.createRadialGradient(sx, sy2, 4, sx, sy2, 80);
    gl.addColorStop(0, 'rgba(255,238,190,.55)'); gl.addColorStop(1, 'rgba(255,238,190,0)');
    ctx.fillStyle = gl; ctx.fillRect(sx - 80, sy2 - 80, 160, 160);
    ctx.fillStyle = prog < .5 ? '#f6f1e4' : '#ffe6a8'; ctx.beginPath(); ctx.arc(sx, sy2, 16, 0, 6.3); ctx.fill();
    ctx.fillStyle = 'rgba(246,241,228,' + (.75 - prog * .7) + ')';
    for (var i = 0; i < stars.length; i++) { var st = stars[i]; ctx.fillRect(st.x, (st.y + cam * .15) % vh, st.r, st.r); }
    ridge([[0, 60], [50, 120], [110, 70], [200, 180], [270, 90], [330, 140], [360, 80]], vh - GROUND + cam * .25, rgb(mix(s[1], [20, 20, 70], .5)), true);
    ridge([[0, 30], [70, 70], [140, 35], [230, 85], [300, 40], [360, 60]], vh - GROUND + cam * .5, rgb(mix(s[1], [8, 8, 40], .75)), false);
    var gy = vh - GROUND + cam;
    ctx.fillStyle = '#0b1030'; ctx.fillRect(-ox - 2, gy, W + ox * 2 + 4, GROUND + 400);
    // prayer-flag bunting along the ground
    ctx.strokeStyle = 'rgba(246,241,228,.55)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-ox - 2, gy + 8); ctx.lineTo(W + ox + 2, gy + 8); ctx.stroke();
    for (var k = 0, x = -ox + 4; x < W + ox; x += 16, k++) { ctx.fillStyle = PAL[k % 5]; ctx.fillRect(x, gy + 9, 10, 13); }
  }
  function block(x, y, w, c) {
    var D = 9, k = D * .6, h = BH - 2, s = SH[c];
    ctx.fillStyle = s.side; ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + D, y - k); ctx.lineTo(x + w + D, y + h - k); ctx.lineTo(x + w, y + h); ctx.fill();
    ctx.fillStyle = s.top; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + D, y - k); ctx.lineTo(x + w + D, y - k); ctx.lineTo(x + w, y); ctx.fill();
    ctx.fillStyle = c; ctx.fillRect(x, y, w, h);
  }
  function text(t, x, y, size, col, align) {
    ctx.font = '700 ' + size + 'px "Trebuchet MS",system-ui,sans-serif';
    ctx.textAlign = align || 'center'; ctx.fillStyle = col || '#f6f1e4'; ctx.fillText(t, x, y);
  }
  function card(y, h) {
    var cw = 300, x = (W - cw) / 2; ctx.fillStyle = 'rgba(12,16,44,.78)'; ctx.beginPath();
    ctx.roundRect(x, y, cw, h, 18);
    ctx.fill(); ctx.strokeStyle = 'rgba(245,197,24,.6)'; ctx.lineWidth = 2; ctx.stroke();
  }
  function draw() {
    if (!vw) return;
    ctx.setTransform(sc * dpr, 0, 0, sc * dpr, ox * sc * dpr, 0);
    drawBg();
    for (var i = 0; i < blocks.length; i++) { var b = blocks[i], y = sy(wy(i)); if (y > vh + BH || y < -BH) continue; block(b.x, y, b.w, PAL[i % 5]); }
    if (state === 'play') block(cur.x, sy(wy(cur.i)), cur.w, PAL[cur.i % 5]);
    for (var d = 0; d < debris.length; d++) { var q = debris[d]; block(q.x, sy(q.y), q.w, q.c); }
    for (var r = 0; r < rings.length; r++) { var o2 = rings[r]; ctx.strokeStyle = 'rgba(255,255,255,' + o2.a + ')'; ctx.lineWidth = 2; ctx.strokeRect(o2.x - o2.g, sy(o2.y) - o2.g, o2.w + o2.g * 2, BH - 2 + o2.g * 2); }
    if (flash > 0) { ctx.fillStyle = 'rgba(255,236,170,' + (flash * .18) + ')'; ctx.fillRect(-ox, 0, W + ox * 2, vh); }
    for (var p = 0; p < pops.length; p++) { var o = pops[p]; ctx.globalAlpha = Math.max(o.a, 0); ctx.font = '700 20px "Trebuchet MS",system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(12,16,44,.85)'; ctx.strokeText(o.t, W / 2, sy(o.y) - 18); text(o.t, W / 2, sy(o.y) - 18, 20, '#f5c518'); ctx.globalAlpha = 1; }
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 2;
    text(String(score), W / 2, 92, 64, '#f6f1e4');
    text('Best ' + Math.max(best, score), W - 16, 48, 15, '#f6f1e4', 'right');
    ctx.shadowColor = 'transparent';
    var pulse = RM ? 1 : .85 + .15 * Math.sin(performance.now() / 300);
    if (state === 'ready') {
      card(vh * .28, 192);
      text('Stack Up', W / 2, vh * .28 + 58, 46, '#f5c518');
      for (var f = 0; f < 5; f++) { ctx.fillStyle = PAL[f]; ctx.fillRect(W / 2 - 45 + f * 18, vh * .28 + 72, 14, 10); }
      text('Drop each block to build the tower.', W / 2, vh * .28 + 110, 14);
      ctx.globalAlpha = pulse; text('Tap to start', W / 2, vh * .28 + 144, 18, '#f5c518'); ctx.globalAlpha = 1;
      text('by ' + DEVELOPER, W / 2, vh * .28 + 176, 13, '#f6f1e4');
    }
    if (state === 'over') {
      card(vh * .28, 190);
      text('Tower fell', W / 2, vh * .28 + 52, 34, '#ff6b5e');
      text(over.nb ? 'New best: ' + score : 'Height ' + score, W / 2, vh * .28 + 92, 24);
      if (!over.nb) text('Best ' + best, W / 2, vh * .28 + 120, 15, 'rgba(246,241,228,.8)');
      ctx.globalAlpha = pulse; text('Tap to stack again', W / 2, vh * .28 + 160, 18, '#f5c518'); ctx.globalAlpha = 1;
    }
  }

  // ---------- Loop ----------
  last = performance.now(); var firstFrame = false, dataReady = false, readySent = false;
  function maybeReady() { if (firstFrame && dataReady && !readySent) { readySent = true; sdk(function (y) { y.game.gameReady(); }); } }
  function frame(now) {
    var dt = Math.min((now - last) / 1000, .05); last = now;
    if (!paused) {
      if (state === 'play') {
        cur.x += cur.dir * speed() * dt;
        if (cur.x < 0) { cur.x = 0; cur.dir = 1; } if (cur.x + cur.w > W) { cur.x = W - cur.w; cur.dir = -1; }
      }
      cam += (camT - cam) * Math.min(dt * 6, 1);
      flash = Math.max(0, flash - dt * 3); skyP += (score - skyP) * Math.min(dt * 2, 1);
      rings = rings.filter(function (o2) { o2.a -= dt * 2.5; o2.g += dt * 45; return o2.a > 0; });
      debris = debris.filter(function (q) { q.vy += 900 * dt; q.y -= q.vy * dt; return sy(q.y) <= vh + 60; });
      pops = pops.filter(function (o) { o.a -= dt * 1.4; o.y += dt * 30; return o.a > 0; });
    }
    draw();
    if (!firstFrame) { firstFrame = true; sdk(function (y) { y.game.firstFrameReady(); }); maybeReady(); }  // must not wait for a non-zero viewport
    raf = paused ? 0 : requestAnimationFrame(frame);
  }

  // ---------- Input ----------
  cv.addEventListener('pointerdown', function (e) { e.preventDefault(); ensureAudioContext(); tap(); });
  window.addEventListener('keydown', function (e) {
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); ensureAudioContext(); if (!e.repeat) tap(); }
  });

  reset(); resize(); loadBest(function () { dataReady = true; maybeReady(); }); raf = requestAnimationFrame(frame);
})();
