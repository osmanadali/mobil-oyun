// Reklam yönetmeni (oyundan sonra). Akış: el 2 hamleyi kendisi yapar (oyun anlatılır) → oyuncu 6 hamle yapar (el yalnız takılınca
// görünür) → son dokunuş koca hattı yakar → oyunun kazanma paneli → hat töreni → indirme kartı. Takılan oyuncuya indirme kartı erken gelir.
(function (w, d) {
  'use strict';
  var A = w.RAY_AD, R = function () { return w.__ray; }, TR = /^tr/i.test(navigator.language || '');
  var T = function (a, b) { return TR ? a : b; };
  var $ = function (id) { return d.getElementById(id); };
  var KEY = A.order[A.order.length - 1], IDLE = 3200, GIVEUP = 45000, MAXTAP = 30;
  var hand, cap, cta, phase = 'boot', lastTap = 0, playAt = 0, taps = 0, demoI = 0;
  function el(tag, cls, html) { var e = d.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function open(which) { if (w.RayCTA) w.RayCTA.openStore(which); }
  function card(cls) {
    var c = el('div', cls, '<img class="ad-ic" alt="" src="' + A.icon + '"><div class="ad-t">Ray: ' + T('Metro Bulmaca', 'Metro Puzzle') + '</div>' +
      '<div class="ad-s">' + T('Metronu bağla, şehrini canlandır', 'Connect your metro, light up your city') + '</div>' +
      '<button class="ad-dl" type="button">' + T('Ücretsiz indir', 'Download free') + '</button>' +
      '<div class="ad-bd"><img data-s="ios" alt="App Store" src="' + A.badgeIos + '"><img data-s="android" alt="Google Play" src="' + A.badgeAnd + '"></div>');
    c.addEventListener('click', function (e) { var b = e.target.closest('[data-s]'); open(b ? b.getAttribute('data-s') : undefined); });
    return c;
  }
  function tileXY(i) { var G = R().G, g = R().geo, r = $('cv').getBoundingClientRect(); return { x: r.left + g.ox + (i % G.cols + .5) * g.s, y: r.top + g.oy + ((i / G.cols | 0) + .5) * g.s, s: g.s, top: r.top }; }
  function next() {
    var G = R().G; if (!G || G.won) return -1;
    var wrong = []; for (var i = 0; i < G.cur.length; i++) if (G.cur[i] !== G.sol[i]) wrong.push(i);
    for (var j = 0; j < A.order.length; j++) if (wrong.indexOf(A.order[j]) >= 0 && A.order[j] !== KEY) return A.order[j];
    for (var k = 0; k < wrong.length; k++) if (wrong[k] !== KEY) return wrong[k];
    return wrong.length ? KEY : -1;
  }
  function say(t, i) { cap.textContent = t; var p = tileXY(i >= 0 ? i : A.order[0]); cap.style.top = Math.max(p.top + 8, p.y - p.s * 1.35) + 'px'; cap.style.opacity = t ? 1 : 0; }
  function point(i, show) { if (i < 0 || !show) { hand.style.opacity = 0; return; } var p = tileXY(i); hand.style.left = p.x + 'px'; hand.style.top = p.y + 'px'; hand.style.setProperty('--s', p.s + 'px'); hand.style.opacity = 1; }
  // el kendisi dokunur (gösterim): oyunun kendi dokunma yolu (fare olayı) kullanılır
  function autoTap(i) { var p = tileXY(i); $('cv').dispatchEvent(new PointerEvent('pointerdown', { clientX: p.x, clientY: p.y, pointerType: 'mouse', bubbles: true })); }
  var DEMO = [T('Karoya dokun: ray döner', 'Tap a tile: the track turns'), T('Hattı merkezden durağa bağla', 'Link the line from hub to station')];
  function demo() {
    if (demoI >= A.demo.length) { phase = 'play'; playAt = performance.now(); lastTap = playAt; say(T('Sıra sende: bütün durakları bağla', 'Your turn: connect every station'), next()); return; }
    var i = A.demo[demoI]; say(DEMO[demoI], i); point(i, true); hand.classList.add('auto');
    setTimeout(function () { autoTap(i); hand.classList.remove('auto'); }, 1100);
    setTimeout(function () { demoI++; demo(); }, 2300);
  }
  function showCta(stuck) {
    if (phase === 'cta') return; phase = 'cta'; hand.style.opacity = 0; cap.style.opacity = 0;
    if (stuck) cta.querySelector('.ad-s').textContent = T('Takıldın mı? Bölümü Ray’de bitir', 'Stuck? Finish the level in Ray');
    cta.classList.add('on');
  }
  function loop() {
    var G = R() && R().G, now = performance.now();
    if (phase === 'play' && G) {
      if (G.won) { phase = 'won'; hand.style.opacity = 0; cap.style.opacity = 0;
        setTimeout(function () { try { R().fest(A.line); } catch (e) {} }, 2300);
        setTimeout(function () { showCta(false); }, 7600);
      } else {
        var i = next(), last = i === KEY;
        if (last) say(T('Son dokunuş: hattı yak!', 'Last tap: light it up!'), i);
        else if (now - lastTap > IDLE) say(T('İpucu: parlayan karoya dokun', 'Hint: tap the glowing tile'), i);
        else if (now - playAt > 2500) cap.style.opacity = 0;
        point(i, last || now - lastTap > IDLE);
        if (now - playAt > GIVEUP || taps > MAXTAP) showCta(true);
      }
    }
    w.requestAnimationFrame(loop);
  }
  function boot() {
    if (!R() || !$('bPlay')) return setTimeout(boot, 30);
    $('bPlay').click();
    hand = el('div', 'ad-hand', '<i></i><b>👆</b>'); cap = el('div', 'ad-cap'); cta = card('ad-cta');
    d.body.appendChild(hand); d.body.appendChild(cap); d.body.appendChild(cta); d.body.appendChild(card('ad-side'));
    // gösterim sırasında oyuncunun dokunuşu tahtaya gitmez (el oynuyor); oyun sırasında dokunuşlar sayılır
    var block = function (e) { if (phase === 'demo' && e.target && e.target.closest && e.target.closest('#board,#cv')) { e.stopPropagation(); e.preventDefault(); } };
    w.addEventListener('touchstart', block, { capture: true, passive: false }); w.addEventListener('pointerdown', function (e) { if (e.isTrusted) block(e); }, true);
    d.addEventListener('pointerdown', function (e) { if (!e.isTrusted) return; lastTap = performance.now(); if (phase === 'play') taps++; }, true);
    // oyun bittikten sonra oyunun düğmeleri (Sonraki, Devam) mağazayı açar; menüye ya da başka bölüme gidilmez
    d.addEventListener('click', function (e) { if (phase === 'play' || phase === 'boot' || phase === 'demo') return; if (e.target.closest('button') && !e.target.closest('.ad-cta,.ad-side')) { e.preventDefault(); e.stopPropagation(); open(); } }, true);
    setTimeout(function () { d.documentElement.classList.remove('ad-boot'); phase = 'demo'; setTimeout(demo, 500); }, 350);
    w.requestAnimationFrame(loop);
  }
  w.RAY_AD_STATE = function () { return { phase: phase, hint: phase === 'play' ? next() : -1, won: !!(R() && R().G && R().G.won), taps: taps }; };
  w.RAY_AD_TILE = function (i) { return tileXY(i); };
  if (w.RayCTA) w.RayCTA.whenReady(boot); else boot();
})(window, document);
