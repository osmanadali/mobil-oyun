// Haftalık lig ve canlı kapışma: ağ katmanı. Oyun (game.js) yalnız bu arayüzü kullanır:
//   Lig.on()                  → lig açık mı (arka uç hazır)
//   Lig.me()                  → { joined, uid, nick, tier } (yerel kopya, anında)
//   Lig.join(nick) / leave()  → katıl (takma ad: serbest yazı, Lig.nickOk ile denetlenir) / ligden çık ve verileri sil
//   Lig.report(uid) / block(uid) → oyuncuyu bildir / gizle (App Store 1.2: kullanıcı içeriği için filtre, bildirme, engelleme)
//   Lig.add(pts)              → haftalık puana ekle; { before, after, board } (tırmanış animasyonu için)
//   Lig.board()               → { week, endsAt, tier, rows: [{ uid, nick, pts, me }], up, down }
//   Lig.duel.find(info)       → rakip arar; { id, level, opp: { nick, tier, ghost } } (iptal: Lig.duel.leave())
//   Lig.duel.host(info) / join(code, info) → arkadaşla: oda kodu üretir ve arkadaşı bekler / koda katılır
//   Lig.duel.send(p) / onOpp(cb) / leave() → kendi ilerlemen { lit, moves, done, ms } / rakibinki / maçtan çık
// Arka uç: Firebase (Firestore + anonim giriş) bağlanınca gerçek; yoksa yalnız geliştirme ve robot testleri için SAHTE
// (window.__ligFake = true). Sahte arka uç yayın sürümünde açılmaz: Lig.on() false → menüde lig görünmez.
window.Lig = (() => {
  const TIERS = 6, GROUP = 30, UP = 7, DOWN = 5;
  const KEY = 'ray.lig';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } };
  let st = load();
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} };
  // hafta: pazartesi 00:00 (UTC+3, Türkiye; yaz saati yok) → herkes için aynı an
  const OFF = 3 * 3600e3, WEEK = 7 * 864e5;
  const weekStart = (t = Date.now()) => { const d = new Date(t + OFF), wd = (d.getUTCDay() + 6) % 7; return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - wd) - OFF; };
  const weekId = (t = Date.now()) => new Date(weekStart(t) + OFF).toISOString().slice(0, 10);
  const rnd = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

  // ---------- takma ad: 3–16 karakter, harf/rakam/boşluk/._-; uygunsuz kelime, bağlantı, e-posta, telefon yok ----------
  // Harfler sadeleştirilir (Türkçe harfler, büyük/küçük, 0→o 1→i 3→e 4→a 5→s 7→t @→a $→s, araya konan nokta/boşluk) sonra yasak köklere bakılır.
  // SUB: içinde geçmesi yeter (uzun, başka kelimede rastlanmayan kökler) · WORD: yalnız tek başına kelime olarak (kısa ya da
  // masum kelimelerin içinde de geçen kökler: "Sikke", "Analiz", "Skill", "Grape" engellenmesin)
  const SUB = ['orospu', 'orsp', 'yarrak', 'yarak', 'pezevenk', 'amina', 'amcik', 'amcuk', 'siktir', 'sikerim', 'sikik', 'sikis', 'yavsak', 'serefsiz', 'gotveren', 'kaltak', 'surtuk', 'dalyarak', 'kahpe', 'gavat',
    'fuck', 'fck', 'shit', 'bitch', 'cunt', 'pussy', 'nigg', 'whore', 'asshole', 'porn', 'hitler', 'penis', 'vagina', 'suicide'];
  const WORD = ['amk', 'aq', 'sik', 'pic', 'ibne', 'meme', 'tasak', 'kasar', 'pust', 'anal', 'sex', 'seks', 'rape', 'cock', 'dick', 'fag', 'slut', 'nazi', 'kill', 'bastard',
    'admin', 'moderator', 'mod', 'official', 'resmi', 'destek', 'support', 'apple', 'google', 'ray'];
  const norm = s => String(s).toLocaleLowerCase('tr').replace(/[çğıöşüâîû]/g, c => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' })[c])
    .replace(/[0134578@$]/g, c => ({ 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's' })[c]).replace(/[^a-z]/g, '').replace(/(.)\1+/g, '$1');
  function nickOk(raw) {
    const s = String(raw || '').trim().replace(/\s+/g, ' ');
    if (s.length < 3) return { ok: false, why: 'short' };
    if (s.length > 16) return { ok: false, why: 'long' };
    if (!/^[\p{L}\p{N} ._-]+$/u.test(s)) return { ok: false, why: 'chars' };
    if (/\d{5,}|https?|www|\.(com|net|org|io)|@/i.test(s)) return { ok: false, why: 'link' };
    const n = norm(s), words = s.split(/[\s._-]+/).map(norm);
    if (SUB.some(w => n.includes(w)) || words.some(x => WORD.includes(x))) return { ok: false, why: 'bad' };
    return { ok: true, nick: s };
  }

  // ---------- sahte arka uç: 29 benzetilmiş oyuncu, puanları haftanın geçen süresiyle büyür ----------
  const fake = {
    others(wk, tier) {
      const R = rnd(hash(wk + ':' + tier)), start = weekStart(Date.parse(wk + 'T00:00:00Z')), f = Math.max(0, Math.min(1, (Date.now() - start) / WEEK));
      return Array.from({ length: GROUP - 1 }, (_, i) => {
        const rate = .25 + R() * 1.1, burst = R(), nick = SIM[(R() * SIM.length) | 0] + (R() < .5 ? ' ' + (10 + (R() * 90 | 0)) : '');
        return { uid: 'sim' + i, nick, pts: Math.round(rate * (60 + tier * 25) * 7 * Math.min(1, f * (.6 + burst))) };
      });
    },
    rows() {
      const wk = weekId(), mine = st.wk === wk ? st.pts || 0 : 0;
      const bl = st.blocked || {};
      return [...fake.others(wk, st.tier || 0).filter(r => !bl[r.uid]), { uid: st.uid, nick: st.nick, pts: mine, me: true }].sort((a, b) => b.pts - a.pts || (a.me ? -1 : 1));
    },
  };
  const SIM = ['Deniz', 'Mert', 'Elif', 'Kuzey', 'Ada', 'Yağmur', 'Rüzgar', 'Ece', 'Bora', 'Lina', 'Toprak', 'Defne', 'Atlas', 'Mira', 'Kaan', 'Nehir', 'Arda', 'Zeynep', 'Raycı', 'metrocu', 'Sky', 'Noah', 'Mia', 'Leo', 'Hana', 'Yuki', 'Luca', 'Sofía', 'Max', 'Emma'];
  const rankOf = rows => rows.findIndex(r => r.me) + 1;
  // hafta değişti: geçen haftanın sırasına göre lig değişir (ilk 7 çıkar, son 5 düşer), puan sıfırlanır
  function roll() {
    const wk = weekId(); if (!st.joined || st.wk === wk) return null;
    let moved = 0;
    if (st.wk) {
      const r = st.lastRank;
      if (r && r <= UP && (st.pts || 0) > 0) moved = 1; else if (r && r > GROUP - DOWN) moved = -1;
      st.tier = Math.max(0, Math.min(TIERS - 1, (st.tier || 0) + moved));
    }
    st.prev = st.wk ? { wk: st.wk, rank: st.lastRank, moved } : null;
    st.wk = wk; st.pts = 0; st.lastRank = 0; keep();
    return st.prev;
  }
  const api = {
    TIERS, GROUP, UP, DOWN, weekId, weekStart, nickOk,
    on: () => !!window.__ligFake,   // Firebase bağlanınca: arka uç hazırsa true
    me: () => ({ joined: !!st.joined, uid: st.uid, nick: st.nick, tier: st.tier || 0, pts: st.wk === weekId() ? st.pts || 0 : 0, prev: st.prev || null }),
    async join(nick) {
      st = { ...st, joined: true, uid: st.uid || 'u' + (hash(Date.now() + ':' + Math.random()) % 1e9), nick, tier: st.tier || 0 };
      roll(); keep(); return api.me();
    },
    async leave() { st = {}; keep(); },   // Firebase: kullanıcının bütün belgeleri ve anonim hesabı silinir
    async rename(nick) { st.nick = nick; keep(); },
    async board() {
      roll();
      const rows = fake.rows(); st.lastRank = rankOf(rows); keep();
      return { week: st.wk, endsAt: weekStart() + WEEK, tier: st.tier || 0, rows, up: UP, down: DOWN };
    },
    async add(pts) {
      if (!st.joined || !(pts > 0)) return null;
      roll();
      const before = fake.rows(), b = rankOf(before);
      st.pts = (st.pts || 0) + pts; keep();
      const after = fake.rows(), a = rankOf(after); st.lastRank = a; keep();
      return { before: b, after: a, pts: st.pts, add: pts, tier: st.tier || 0, rows: after, prevRows: before };
    },
    seen() { st.prev = null; keep(); },
    async report(uid, why = '') { st.reported = { ...(st.reported || {}), [uid]: why || 1 }; keep(); },   // Firebase: reports/{id} belgesi (inceleme için)
    block(uid) { st.blocked = { ...(st.blocked || {}), [uid]: 1 }; keep(); },
  };

  // ---------- canlı kapışma ----------
  // Sahte: 2–5 sn'de rakip "bulunur"; ilerlemesi 25–60 sn'lik bir çözüm eğrisiyle gelir. Gerçek arka uçta rakip
  // bulunamazsa gerçek bir oyuncunun kayıtlı oyunu (ghost: true) oynatılır ve ekranda öyle yazar.
  let duel = null;
  api.duel = {
    async find(info = {}) {
      api.duel.leave();
      const me = duel = { id: 'm' + (hash(Date.now() + ':' + Math.random()) % 1e9), cbs: [], timers: [], left: false };
      await new Promise(r => me.timers.push(setTimeout(r, info.wait ?? (2000 + Math.random() * 3000))));
      if (me.left) return null;
      const R = rnd(hash(me.id)), ghost = !!info.ghost, T = (info.oppT ?? (25 + R() * 35)) * 1000, t0 = Date.now() + 3000;   // 3 sn geri sayım
      me.opp = { nick: info.friend || SIM[(R() * SIM.length) | 0], friend: !!info.friend, tier: Math.max(0, (st.tier || 0) + (R() < .3 ? -1 : R() < .7 ? 0 : 1)), ghost };
      const level = info.levels ? info.levels[(R() * info.levels.length) | 0] : 1;
      // rakibin ilerlemesi: önce yavaş, sonra hızlanan; arada duraksamalar
      const tick = () => {
        if (me.left) return;
        const e = Date.now() - t0, f = Math.max(0, Math.min(1, e / T)), lit = f >= 1 ? 1 : Math.min(.97, Math.pow(f, 1.4) + (R() - .5) * .04);
        const p = { lit: Math.max(0, lit), moves: Math.round(f * (12 + R() * 3) * (T / 30000)), done: f >= 1, ms: Math.max(0, e) };
        me.cbs.forEach(cb => cb(p));
        if (!p.done) me.timers.push(setTimeout(tick, 700 + R() * 600));
      };
      me.timers.push(setTimeout(tick, 3000));
      return { id: me.id, level, t0, opp: me.opp };
    },
    // arkadaşla: oda kodu (karışmasın diye O/0/I/1 yok). Sahte: arkadaş 4 sn sonra katılır.
    async host(info = {}) {
      api.duel.leave();
      const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', R = rnd(hash(Date.now() + ':' + Math.random())), code = Array.from({ length: 5 }, () => A[(R() * A.length) | 0]).join('');
      return { code, wait: () => api.duel.find({ ...info, wait: info.wait ?? 4000, friend: info.friendNick || 'Arkadaşın' }) };
    },
    async join(code, info = {}) {
      if (!/^[A-Z2-9]{5}$/.test(String(code || '').toUpperCase())) return { error: 'code' };
      return api.duel.find({ ...info, wait: 800, friend: info.friendNick || 'Arkadaşın' });
    },
    send() {},   // Firebase: kendi ilerlemen maç belgesine yazılır (hamle başına en çok 2/sn)
    onOpp(cb) { duel?.cbs.push(cb); },
    leave() { if (!duel) return; duel.left = true; duel.timers.forEach(clearTimeout); duel = null; },
  };
  return api;
})();
