// Reklam yönetmeni (oyundan sonra): bölümü açar, sıradaki karoyu gösteren el, kazanınca hat töreni ve indirme kartı.
(function (w, d) {
  'use strict';
  var A = w.RAY_AD, R = function () { return w.__ray; }, TR = /^tr/i.test(navigator.language || '');
  var T = function (a, b) { return TR ? a : b; };
  var $ = function (id) { return d.getElementById(id); };
  var hand, cap, cta, side, phase = 'boot', wonAt = 0, lastTap = 0;
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
  function next() {
    var G = R().G; if (!G || G.won) return -1;
    var key = A.order[A.order.length - 1], wrong = [];
    for (var i = 0; i < G.cur.length; i++) if (G.cur[i] !== G.sol[i]) wrong.push(i);
    for (var j = 0; j < wrong.length; j++) if (wrong[j] !== key) return wrong[j];
    return wrong.length ? key : -1;
  }
  function place() {
    var i = next(), G = R().G, g = R().geo;
    if (i < 0 || phase !== 'play') { hand.style.opacity = 0; cap.style.opacity = 0; return; }
    var r = $('cv').getBoundingClientRect(), x = r.left + g.ox + (i % G.cols + .5) * g.s, y = r.top + g.oy + ((i / G.cols | 0) + .5) * g.s;
    hand.style.left = x + 'px'; hand.style.top = y + 'px'; hand.style.setProperty('--s', g.s + 'px');
    hand.style.opacity = performance.now() - lastTap > 700 ? 1 : 0;
    var last = i === A.order[A.order.length - 1];
    cap.textContent = last ? T('Son dokunuş: hattı yak!', 'Last tap: light it up!') : T('Karoya dokun, rayı çevir', 'Tap a tile to turn the track');
    cap.style.top = Math.max(r.top + 8, y - g.s * 1.35) + 'px'; cap.style.opacity = 1;
  }
  function loop() {
    var G = R() && R().G;
    if (phase === 'play' && G && G.won) { phase = 'won'; wonAt = performance.now(); hand.style.opacity = 0; cap.style.opacity = 0;
      setTimeout(function () { try { R().fest(A.line); } catch (e) {} }, 2300);
      setTimeout(function () { phase = 'cta'; cta.classList.add('on'); }, 7600); }
    if (phase === 'play') place();
    w.requestAnimationFrame(loop);
  }
  function boot() {
    if (!R() || !$('bPlay')) return setTimeout(boot, 30);
    $('bPlay').click();
    hand = el('div', 'ad-hand', '<i></i><b>👆</b>'); cap = el('div', 'ad-cap'); cta = card('ad-cta');
    d.body.appendChild(hand); d.body.appendChild(cap); d.body.appendChild(cta);
    side = card('ad-side'); d.body.appendChild(side);
    d.addEventListener('pointerdown', function () { lastTap = performance.now(); }, true);
    // oyun bittikten sonra oyunun düğmeleri (Sonraki, Devam) mağazayı açar; menüye ya da başka bölüme gidilmez
    d.addEventListener('click', function (e) { if (phase === 'play' || phase === 'boot') return; if (e.target.closest('button') && !e.target.closest('.ad-cta,.ad-side')) { e.preventDefault(); e.stopPropagation(); open(); } }, true);
    setTimeout(function () { d.documentElement.classList.remove('ad-boot'); phase = 'play'; }, 350);
    w.requestAnimationFrame(loop);
  }
  w.RAY_AD_STATE = function () { return { phase: phase, hint: next(), won: !!(R() && R().G && R().G.won) }; };
  w.RAY_AD_TILE = function (i) { var G = R().G, g = R().geo, r = $('cv').getBoundingClientRect(); return { x: r.left + g.ox + (i % G.cols + .5) * g.s, y: r.top + g.oy + ((i / G.cols | 0) + .5) * g.s }; };
  if (w.RayCTA) w.RayCTA.whenReady(boot); else boot();
})(window, document);
