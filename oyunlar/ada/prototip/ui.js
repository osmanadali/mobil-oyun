// Ada prototipi — ekranlar, geçişler, HUD ve kayıt arayüzü
import { LEVELS, starTimes, store, fmt, fmtSn, dailyLevel, dateLabel } from './data.js';
import { audio } from './audio.js';

const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const ic = id => `<svg aria-hidden="true"><use href="#i-${id}"/></svg>`;
const starsHtml = (n, cls = '') => [0, 1, 2].map(i => `<svg class="${i < n ? 'on' : ''} ${cls}" aria-hidden="true"><use href="#i-star"/></svg>`).join('');
const typeName = L => L.type === 'kopru' ? 'Üçlü Köprü' : 'Hedef Dizisi';
const windName = w => !w ? 'yok' : w < 1 ? 'hafif' : w < 1.6 ? 'orta' : 'sert';

let api = null, cur = 'splash', introL = null, lastL = null, timeStr = '', bannerTimer = 0, toastTimer = 0, wiping = false, resultTimers = [];

// ---------- ekran geçişi (turkuaz dalga perdesi) ----------
function show(name, mid) {
  const next = $('#s-' + name);
  const swap = () => {
    $$('.screen').forEach(s => s.classList.toggle('on', s === next));
    next.classList.remove('enter'); void next.offsetWidth; next.classList.add('enter');
    cur = name;
    if (name === 'levels') buildMap();
    if (name === 'board') buildBoard();
    if (name === 'settings') syncToggles();
    if (mid) mid();
    api.onScreen(name);
  };
  if (RM || wiping || !document.body.animate) { swap(); return Promise.resolve(); }
  wiping = true;
  const w = $('#wipe'); w.classList.add('run');
  return new Promise(res => {
    const a = w.animate([{ transform: 'translateY(110%)' }, { transform: 'translateY(0%)' }], { duration: 170, easing: 'cubic-bezier(.55,0,.8,.3)', fill: 'forwards' });
    a.onfinish = () => {
      swap();
      const b = w.animate([{ transform: 'translateY(0%)' }, { transform: 'translateY(-112%)' }], { duration: 220, easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'forwards' });
      b.onfinish = () => { w.classList.remove('run'); wiping = false; res(); };
    };
  });
}
function overlay(name, on) {
  const o = $('#o-' + name);
  if (on) { o.classList.remove('on'); void o.offsetWidth; }
  o.classList.toggle('on', on);
}
function toast(text) {
  const t = $('#toast'); t.textContent = text; t.classList.add('on');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('on'), 1900);
}

// ---------- ayarlar ----------
function setSetting(k, v) {
  store.data.settings[k] = v; store.save();
  if (k !== 'vib') audio.set(k, v);
  if (k === 'vib' && v) try { navigator.vibrate && navigator.vibrate(30); } catch (e) { /* yok */ }
}
function syncToggles() {
  const S = store.data.settings;
  $$('[data-set]').forEach(b => b.setAttribute('aria-pressed', String(!!S[b.dataset.set])));
  const muted = !S.sfx && !S.music;
  $('#m-mute use').setAttribute('href', muted ? '#i-mute' : '#i-sound');
  $('#vib-note').textContent = 'vibrate' in navigator ? '' : 'Bu cihaz titreşimi desteklemiyor.';
}

// ---------- karakter seçimi ----------
function setChar(c) {
  store.data.char = c; store.save();
  $$('.pick').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.char === c)));
  api.setChar(c);
}

// ---------- bölüm haritası ----------
function buildMap() {
  const inner = $('#map-inner'), D = store.data, n = LEVELS.length;
  const W = Math.min(440, inner.clientWidth || innerWidth), step = 94, H = 150 + n * step;
  inner.style.height = H + 'px';
  const pts = LEVELS.map((L, i) => ({ x: Math.round(W / 2 + Math.sin(i * 1.2 + 0.5) * W * 0.25), y: H - 92 - i * step }));
  let d = `M ${pts[0].x} ${H}`;
  pts.forEach((p, i) => { const q = i ? pts[i - 1] : { x: pts[0].x, y: H }; const my = (q.y + p.y) / 2; d += ` C ${q.x} ${my}, ${p.x} ${my}, ${p.x} ${p.y}`; });
  let html = `<div class="island"></div><svg class="trail" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><path class="t-bg" d="${d}"/><path class="t-dash" d="${d}"/></svg>`;
  [[0.12, 0.2], [0.8, 0.33], [0.1, 0.62], [0.84, 0.8], [0.5, 0.06]].forEach(([x, y]) => { html += `<svg class="deco" style="left:${x * W - 23}px;top:${y * H}px" viewBox="0 0 48 48"><use href="#i-palm"/></svg>`; });
  html += `<div class="map-label" style="top:${H - 40}px">Başlangıç İskelesi</div><div class="map-label" style="top:22px">Kumsal Finali</div>`;
  let total = 0;
  LEVELS.forEach((L, i) => {
    const st = D.stars[L.id] || 0; total += st;
    const locked = L.n > D.unlocked, next = !locked && L.n === D.unlocked && !st;
    html += `<button class="node ${L.type}${locked ? ' locked' : ''}${next ? ' next' : ''}" data-n="${L.n}" style="left:${pts[i].x}px;top:${pts[i].y}px"
      aria-label="Bölüm ${L.n}, ${typeName(L)}${locked ? ', kilitli' : `, ${st} yıldız`}"><span class="n">${L.n}</span><svg class="lk" aria-hidden="true"><use href="#i-lock"/></svg>
      <span class="ty">${ic(L.type === 'kopru' ? 'bridge' : 'target')}</span><span class="ns">${starsHtml(st)}</span></button>`;
  });
  inner.innerHTML = html;
  $('#lv-stars').textContent = `${total}/${n * 3}`;
  $$('.node', inner).forEach(b => b.onclick = () => {
    const L = LEVELS[+b.dataset.n - 1];
    if (L.n > D.unlocked) { b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); toast('Önce önceki bölümü bitir'); return; }
    openIntro(L);
  });
  const target = pts[Math.min(n, D.unlocked) - 1];
  requestAnimationFrame(() => { const m = $('#map'); m.scrollTop = Math.max(0, target.y - m.clientHeight * 0.6); });
}

// ---------- bölüm giriş kartı ----------
function openIntro(L) {
  introL = L;
  const k = L.type === 'kopru', [t3, t2] = starTimes(L), best = store.data.best[L.id];
  $('#in-kick').textContent = L.daily ? `Günün Adası · ${dateLabel()} · ${typeName(L)}` : `Bölüm ${L.n} · ${typeName(L)}`;
  $('#in-name').textContent = L.name;
  const icb = $('#in-ic'); icb.className = 'type-ic ' + (L.daily ? 'daily' : L.type); icb.innerHTML = ic(k ? 'bridge' : 'target');
  $('#in-memo').textContent = k
    ? 'Her sırada yalnızca bir taş sağlam. Taşlar sırayla parlar: hangisinin parladığını ezberle, sonra yalnızca onlara zıpla.'
    : 'Hedefler numarayla sırayla yanar. Sırayı ezberle, sonra aşağıdan yukarı kaydırarak aynı sırayla vur.';
  const facts = k
    ? [`${L.rows} sıra × 3 taş`, `Ezber: ${String(L.glow).replace('.', ',')} sn / taş`, ['Yanlış taş +4 sn', 'warn'], ['Fener +6 sn', 'warn']]
    : [`${L.targets} hedef`, `${L.seq} atışlık dizi`, `Rüzgâr: ${windName(L.wind)}`, ['Iska +3 sn', 'warn'], ['Fener +6 sn', 'warn']];
  $('#in-facts').innerHTML = facts.map(f => Array.isArray(f) ? `<li class="${f[1]}">${f[0]}</li>` : `<li>${f}</li>`).join('');
  $('#in-t3').textContent = '≤ ' + fmtSn(t3); $('#in-t2').textContent = '≤ ' + fmtSn(t2);
  $$('#o-intro .mini-stars').forEach(s => { const c = +s.className.match(/s(\d)/)[1]; s.innerHTML = starsHtml(c); });
  $('#in-best').textContent = best != null ? `En iyi süren: ${fmtSn(best)}` : 'Henüz oynanmadı';
  overlay('results', false);
  overlay('intro', true);
}

// ---------- sıralama ----------
function buildBoard() {
  const D = store.data, dl = dailyLevel();
  const rows = [dl, ...LEVELS].map(L => {
    const b = D.best[L.id], st = D.stars[L.id] || 0;
    return `<li class="${b == null ? 'none' : ''}"><span class="bn ${L.daily ? 'daily' : L.type}">${L.daily ? ic('sun') : L.n}</span>
      <span class="bname">${L.daily ? 'Günün Adası' : L.name}<small>${L.daily ? dateLabel() + ' · ' : ''}${typeName(L)}</small></span>
      <span class="bt">${b == null ? '—' : fmtSn(b)}<br><span class="mini-stars">${b == null ? '' : starsHtml(st)}</span></span></li>`;
  });
  $('#board-list').innerHTML = rows.join('');
}

// ---------- HUD ----------
function setTime(s) { const t = fmt(s); if (t !== timeStr) { timeStr = t; $('#h-time').textContent = t; } }
function setLeft(n) { const p = $('.left-pill'); $('#h-left').textContent = n; p.classList.remove('bump'); void p.offsetWidth; p.classList.add('bump'); }
function banner(text, sub, ms) {
  const b = $('#h-banner'); clearTimeout(bannerTimer);
  if (!text) { b.classList.remove('on'); return; }
  $('#h-btext').textContent = text;
  const s = $('#h-bsub'); s.textContent = sub ?? ''; s.hidden = sub == null || sub === '';
  b.classList.toggle('go', text === 'GİT!');
  b.classList.remove('on'); void b.offsetWidth; b.classList.add('on');
  if (ms) bannerTimer = setTimeout(() => b.classList.remove('on'), ms);
}
function bannerSub(v) { const s = $('#h-bsub'); s.textContent = v; s.hidden = false; s.classList.remove('tick'); void s.offsetWidth; s.classList.add('tick'); }
function hint(t, nudge) { const h = $('#h-hint'); h.textContent = t || ''; if (nudge) { h.classList.remove('nudge'); void h.offsetWidth; h.classList.add('nudge'); } }
function lantern(on) { $('#h-lantern').disabled = !on; }
function power(p) { const el = $('#h-power'); if (p == null) { el.hidden = true; return; } el.hidden = false; $('#h-powerbar').style.height = Math.round(p * 100) + '%'; }
function hud(o) {
  $('#s-game').classList.remove('done');
  $('#h-unit').textContent = o.unit; $('#h-left').textContent = o.left; timeStr = ''; setTime(0);
  const w = $('#h-wind'); w.hidden = o.wind == null;
  if (o.wind != null) {
    $('#h-windt').textContent = o.wind === 0 ? 'Rüzgâr yok' : `Rüzgâr ${windName(Math.abs(o.wind))} ${Math.abs(o.wind).toFixed(1).replace('.', ',')}`;
    $('#h-warrow').style.transform = o.wind < 0 ? 'scaleX(-1)' : 'none';
    $('#h-warrow').style.opacity = o.wind === 0 ? '0.3' : '1';
  }
  lantern(false); hint(''); banner(null); power(null);
}
function penalty(text, x, y) {
  const el = document.createElement('div'); el.className = 'pen'; el.textContent = text;
  if (x === 'lantern') { const r = $('#h-lantern').getBoundingClientRect(); x = r.left + r.width / 2; y = r.top - 10; }
  el.style.left = x + 'px'; el.style.top = y + 'px'; $('#pops').appendChild(el);
  const tr = $('#h-timer').getBoundingClientRect(), dx = tr.left + tr.width / 2 - x, dy = tr.top + tr.height / 2 - y;
  const a = el.animate([
    { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1.25)', opacity: 1, offset: 0.16 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.48 },
    { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(.45)`, opacity: 0.3 },
  ], { duration: RM ? 500 : 1050, easing: 'cubic-bezier(.45,0,.25,1)' });
  a.onfinish = () => { el.remove(); const t = $('#h-timer'); t.classList.remove('hit'); void t.offsetWidth; t.classList.add('hit'); };
}

// ---------- sonuç ----------
function sparkle(el) {
  if (RM) return;
  for (let i = 0; i < 10; i++) {
    const s = document.createElement('i'); s.className = 'spark';
    const a = (i / 10) * Math.PI * 2, r = 46 + Math.random() * 18;
    s.style.setProperty('--dx', Math.cos(a) * r + 'px'); s.style.setProperty('--dy', Math.sin(a) * r + 'px');
    el.appendChild(s); setTimeout(() => s.remove(), 650);
  }
}
let shareTextVal = '';
function results(R) {
  lastL = R.L; resultTimers.forEach(clearTimeout); resultTimers = [];
  $('#s-game').classList.add('done');
  $('#r-kick').textContent = R.L.daily ? `Günün Adası · ${dateLabel()}` : `Bölüm ${R.L.n} · ${typeName(R.L)}`;
  $('#r-title').textContent = R.stars === 3 ? 'Kusursuz!' : R.stars === 2 ? 'Harika!' : 'Tamamlandı!';
  const sts = $$('#r-stars .st'); sts.forEach(s => s.classList.remove('on'));
  $('#r-ribbon').classList.remove('show');
  const pen = R.pens.reduce((a, p) => a + p.n * p.sec, 0);
  $('#r-break').innerHTML = `<li><span>Koşu süresi</span><b>${fmtSn(R.raw)}</b></li>` +
    R.pens.map(p => `<li class="${p.n ? 'pen-row' : ''}"><span>${p.label} × ${p.n}</span><b>+${p.n * p.sec} sn</b></li>`).join('') +
    `<li class="total"><span>Toplam${pen ? ' (cezalı)' : ''}</span><b>${fmtSn(R.total)}</b></li>`;
  const [t3, t2] = R.times;
  $('#r-best').textContent = `En iyi: ${fmtSn(R.best)}  ·  3 yıldız ≤ ${fmtSn(t3)}  ·  2 yıldız ≤ ${fmtSn(t2)}`;
  const nb = $('#r-next');
  nb.innerHTML = R.hasNext ? `Sonraki${ic('next')}` : `${ic('home')}Menü`;
  shareTextVal = `Ada · ${R.L.daily ? 'Günün Adası ' + dateLabel() : 'Bölüm ' + R.L.n} (${typeName(R.L)}): ${fmtSn(R.total)} ${'★'.repeat(R.stars)}${'☆'.repeat(3 - R.stars)}${pen ? ` (${pen} sn ceza)` : ' (cezasız)'}`;
  $('#r-time').textContent = fmtSn(0);
  overlay('results', true);
  const dur = RM ? 0 : 900, t0 = performance.now();
  const tick = now => {
    const k = dur ? Math.min(1, (now - t0) / dur) : 1, e = 1 - (1 - k) ** 3;
    $('#r-time').textContent = fmtSn(R.total * e);
    if (k < 1) requestAnimationFrame(tick); else starsIn();
  };
  requestAnimationFrame(tick);
  function starsIn() {
    for (let i = 0; i < R.stars; i++) resultTimers.push(setTimeout(() => { sts[i].classList.add('on'); sparkle(sts[i]); audio.sfx('pop', i); }, 120 + i * 300));
    if (R.record) resultTimers.push(setTimeout(() => { $('#r-ribbon').classList.add('show'); audio.sfx('record'); }, 220 + R.stars * 300));
  }
}
async function share() {
  const text = shareTextVal;
  try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(text); toast('Sonuç panoya kopyalandı'); return; } } catch (e) { /* yedeğe geç */ }
  try {
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0'; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand && document.execCommand('copy'); ta.remove();
    if (ok) { toast('Sonuç panoya kopyalandı'); return; }
  } catch (e) { /* elle kopyalama */ }
  $('#share-text').value = text; overlay('share', true);
  setTimeout(() => { try { $('#share-text').select(); } catch (e) { /* yok */ } }, 50);
}

// ---------- bağlama ----------
function bind() {
  document.addEventListener('pointerdown', e => {
    audio.unlock();
    const b = e.target.closest('button');
    if (b && !b.disabled) audio.sfx('click');
  }, true);
  document.addEventListener('keydown', () => audio.unlock(), true);
  $('#s-splash').addEventListener('click', () => api.skipSplash());
  $('#m-play').onclick = () => show('levels');
  $('#m-daily').onclick = () => openIntro(dailyLevel());
  $('#m-board').onclick = () => show('board');
  $('#m-settings').onclick = () => show('settings');
  $('#m-mute').onclick = () => { const S = store.data.settings, on = !(S.sfx || S.music); setSetting('sfx', on); setSetting('music', on); syncToggles(); toast(on ? 'Ses açık' : 'Ses kapalı'); };
  $('#m-date').textContent = dateLabel();
  $$('[data-back]').forEach(b => b.onclick = () => show(b.dataset.back));
  $$('.pick').forEach(b => b.onclick = () => setChar(b.dataset.char));
  $('#in-close').onclick = () => { overlay('intro', false); if (cur === 'game') show('levels', () => api.toMenu(true)); };
  $('#in-start').onclick = () => { const L = introL; overlay('intro', false); overlay('results', false); show('game', () => api.start(L)); };
  $('#h-pause').onclick = () => { if (api.pause()) overlay('pause', true); };
  $('#h-lantern').onclick = () => api.lantern();
  $('#p-resume').onclick = () => { overlay('pause', false); api.resume(); };
  $('#p-restart').onclick = () => { overlay('pause', false); show('game', () => api.restart()); };
  $('#p-menu').onclick = () => { overlay('pause', false); show('menu', () => api.toMenu()); };
  $('#r-retry').onclick = () => { overlay('results', false); show('game', () => api.restart()); };
  $('#r-next').onclick = () => {
    const L = lastL && !lastL.daily && LEVELS[lastL.n];
    if (L) openIntro(L); else { overlay('results', false); show('menu', () => api.toMenu()); }
  };
  $('#r-home').onclick = () => { overlay('results', false); show('levels', () => api.toMenu(true)); };
  $('#r-share').onclick = share;
  $('#share-close').onclick = () => overlay('share', false);
  $$('[data-set]').forEach(b => b.onclick = () => { const k = b.dataset.set; setSetting(k, !store.data.settings[k]); syncToggles(); });
  let resetArm = 0;
  $('#set-reset').onclick = e => {
    const b = e.currentTarget;
    if (Date.now() - resetArm < 3000) { store.resetProgress(); b.textContent = 'İlerleme sıfırlandı'; resetArm = 0; return; }
    resetArm = Date.now(); b.textContent = 'Emin misin? Tekrar dokun';
    setTimeout(() => { if (resetArm) { b.textContent = 'İlerlemeyi sıfırla'; resetArm = 0; } }, 3000);
  };
}

export const ui = {
  init(a) {
    api = a; bind(); syncToggles();
    const S = store.data.settings; audio.set('sfx', S.sfx); audio.set('music', S.music);
    $$('.pick').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.char === store.data.char)));
  },
  get screen() { return cur; },
  show, overlay, toast, openIntro, hud, setTime, setLeft, banner, bannerSub, hint, lantern, power, penalty, results,
  setLoad(p, text) { $('#loadbar').style.width = Math.round(4 + p * 96) + '%'; if (text) $('#loadt').textContent = text; },
  isOverlay(name) { return $('#o-' + name).classList.contains('on'); },
};
