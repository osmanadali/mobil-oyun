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
    on: () => true,
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
  const fakeApi = api;
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

  // ---------- Firebase arka ucu: REST (kütüphane yok; uygulamaya ~10 KB). Kurallar: firestore.rules ----------
  // Kimlik: anonim hesap (Identity Toolkit). Yenileme anahtarı bu cihazda; ligden çıkınca hesap ve belgeler silinir.
  // Belgeler: users/{uid} · weeks/{hafta}/members/{uid} (grp: "t1g3", pts) · weeks/{hafta}/tiers/{t} (n: sayaç)
  //           q/{uid} (rastgele rakip kuyruğu) · rooms/{kod} (arkadaş odası) · matches/{id} (pa / pb: ilerleme) · ghosts/{id} · reports/{id}
  function FB(base) {
    const CFG = { key: 'AIzaSyDGNsBIk6X0qx2wqHEGSinPWJoCcaypXec', project: 'ray-metro' };
    const DOCS = `https://firestore.googleapis.com/v1/projects/${CFG.project}/databases/(default)/documents`, NAME = `projects/${CFG.project}/databases/(default)/documents`;
    let tok = null, tokExp = 0, skew = 0, rowsAt = 0, rowsCache = null;
    // --- kimlik ---
    async function auth() {
      if (tok && Date.now() < tokExp - 60e3) return tok;
      let r;
      if (st.rt) r = await fetch(`https://securetoken.googleapis.com/v1/token?key=${CFG.key}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=refresh_token&refresh_token=' + encodeURIComponent(st.rt) }).then(x => x.json());
      if (!r?.id_token) {
        const s = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${CFG.key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{"returnSecureToken":true}' }).then(x => x.json());
        if (!s.idToken) throw Error('auth');
        r = { id_token: s.idToken, refresh_token: s.refreshToken, user_id: s.localId, expires_in: s.expiresIn };
      }
      tok = r.id_token; tokExp = Date.now() + (+r.expires_in || 3600) * 1e3; st.rt = r.refresh_token; st.uid = r.user_id; keep();
      return tok;
    }
    // --- Firestore değer dönüşümü ---
    const enc = v => v === null || v === undefined ? { nullValue: null } : typeof v === 'boolean' ? { booleanValue: v } : typeof v === 'number' ? (Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v })
      : typeof v === 'string' ? { stringValue: v } : Array.isArray(v) ? { arrayValue: { values: v.map(enc) } } : { mapValue: { fields: encF(v) } };
    const encF = o => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined).map(([k, v]) => [k, enc(v)]));
    const dec = v => !v ? null : 'integerValue' in v ? +v.integerValue : 'doubleValue' in v ? v.doubleValue : 'stringValue' in v ? v.stringValue : 'booleanValue' in v ? v.booleanValue
      : 'arrayValue' in v ? (v.arrayValue.values || []).map(dec) : 'mapValue' in v ? decF(v.mapValue.fields || {}) : 'timestampValue' in v ? Date.parse(v.timestampValue) : null;
    const decF = f => Object.fromEntries(Object.entries(f || {}).map(([k, v]) => [k, dec(v)]));
    const doc = d => d?.fields ? { id: d.name.split('/').pop(), ...decF(d.fields) } : null;
    async function call(method, url, body) {
      const r = await fetch(url, { method, headers: { Authorization: 'Bearer ' + await auth(), 'Content-Type': 'application/json' }, body: body && JSON.stringify(body) });
      if (r.status === 404) return null;
      const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
      if (!r.ok) { const e = Error(j.error?.status || 'http ' + r.status); e.code = r.status; throw e; }
      return j;
    }
    const get = async (path, tx) => doc(await call('GET', `${DOCS}/${path}${tx ? '?transaction=' + encodeURIComponent(tx) : ''}`));
    const del = path => call('DELETE', `${DOCS}/${path}`).catch(() => {});
    // yazma: update (alanlar) + isteğe bağlı artırma; tx ile işlem içinde
    const w = (path, data, { inc, exists } = {}) => ({ update: { name: `${NAME}/${path}`, fields: encF(data) }, ...(data ? { updateMask: { fieldPaths: Object.keys(data).filter(k => data[k] !== undefined) } } : {}),
      ...(inc ? { updateTransforms: Object.entries(inc).map(([k, n]) => ({ fieldPath: k, increment: enc(n) })) } : {}), ...(exists != null ? { currentDocument: { exists } } : {}) });
    async function commit(writes, tx) {
      const r = await call('POST', `${DOCS}:commit`, { writes, ...(tx ? { transaction: tx } : {}) });
      if (r?.commitTime) skew = Date.parse(r.commitTime) - Date.now();   // sunucu saati farkı (geri sayım iki cihazda aynı ana denk gelsin)
      return r;
    }
    async function txn(fn) {   // işlem: çakışırsa 3 kez yeniden dene
      for (let k = 0; k < 3; k++) {
        const { transaction: tx } = await call('POST', `${DOCS}:beginTransaction`, {});
        try { const writes = await fn(tx); if (!writes) { await call('POST', `${DOCS}:rollback`, { transaction: tx }).catch(() => {}); return null; } await commit(writes, tx); return true; }
        catch (e) { if (e.code !== 409 && e.code !== 400 && k < 2 && e.message !== 'ABORTED') throw e; }
      }
      return null;
    }
    async function query(parent, where, limit = 50) {
      const filters = where.map(([f, op, v]) => ({ fieldFilter: { field: { fieldPath: f }, op, value: enc(v) } }));
      const r = await call('POST', `${DOCS}${parent ? '/' + parent : ''}:runQuery`, { structuredQuery: { from: [{ collectionId: where.coll }], where: filters.length > 1 ? { compositeFilter: { op: 'AND', filters } } : filters[0], limit } });
      return (r || []).map(x => doc(x.document)).filter(Boolean);
    }
    const Q = (coll, ...where) => Object.assign(where, { coll });
    const now = () => Date.now() + skew;

    // --- lig ---
    const grpKey = (t, g) => `t${t}g${g}`;
    async function ensureWeek() {
      const wk = weekId();
      if (st.wk === wk && st.grp) return;
      // hafta değişti: geçen haftanın sırası (sunucudan) → terfi / düşme
      let moved = 0, rank = 0;
      if (st.wk && st.grp) {
        try { const rows = (await query(`weeks/${st.wk}`, Q('members', ['grp', 'EQUAL', st.grp]), 60)).sort((a, b) => b.pts - a.pts); rank = rows.findIndex(r => r.id === st.uid) + 1;
          const me = rows[rank - 1]; if (rank && rank <= UP && me?.pts > 0) moved = 1; else if (rank && rank > Math.max(rows.length, GROUP) - DOWN) moved = -1; } catch {}
        st.tier = Math.max(0, Math.min(TIERS - 1, (st.tier || 0) + moved));
        st.prev = { wk: st.wk, rank, moved };
      }
      // yeni grup: o haftanın o kademesindeki sayaç → her 30 kişiye bir grup
      const t = st.tier || 0; let g = 0;
      await txn(async tx => { const c = await get(`weeks/${wk}/tiers/${t}`, tx), n = c?.n || 0; g = n / GROUP | 0; return [w(`weeks/${wk}/tiers/${t}`, { n: n + 1 })]; });
      st.wk = wk; st.grp = grpKey(t, g); st.pts = 0; keep();
      await commit([w(`weeks/${wk}/members/${st.uid}`, { grp: st.grp, nick: st.nick, tier: t, pts: 0, at: now() }), w(`users/${st.uid}`, { nick: st.nick, tier: t, wk, grp: st.grp })]);
      rowsCache = null;
    }
    async function rows(force) {
      if (!force && rowsCache && Date.now() - rowsAt < 60e3) return rowsCache;   // dakikada en çok bir okuma (ücretsiz kota)
      const bl = st.blocked || {};
      const r = (await query(`weeks/${st.wk}`, Q('members', ['grp', 'EQUAL', st.grp]), 60)).filter(x => !bl[x.id] || x.id === st.uid)
        .map(x => ({ uid: x.id, nick: x.nick, pts: x.pts || 0, me: x.id === st.uid }));
      if (!r.some(x => x.me)) r.push({ uid: st.uid, nick: st.nick, pts: st.pts || 0, me: true });
      rowsCache = r; rowsAt = Date.now(); return r;
    }
    const sorted = r => r.slice().sort((a, b) => b.pts - a.pts || (a.me ? -1 : b.me ? 1 : 0));
    const rankOf = r => sorted(r).findIndex(x => x.me) + 1;
    const fb = {
      ...base,
      on: () => true,
      async join(nick) {
        st = { ...st, joined: true, nick, tier: st.tier || 0, wk: '', grp: '' }; keep();
        await auth(); await ensureWeek(); return fb.me();
      },
      async leave() {
        try {
          await auth();
          const gs = await query('', Q('ghosts', ['by', 'EQUAL', st.uid]), 200).catch(() => []);   // kayıtlı oyunlarım (takma adımı taşır)
          await Promise.all([st.wk && del(`weeks/${st.wk}/members/${st.uid}`), del(`users/${st.uid}`), del(`q/${st.uid}`), ...gs.map(g => del(`ghosts/${g.id}`))]);
          await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${CFG.key}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ idToken: tok }) });
        } catch {}
        st = {}; tok = null; rowsCache = null; keep();
      },
      async rename(nick) { st.nick = nick; keep(); await commit([w(`users/${st.uid}`, { nick }), w(`weeks/${st.wk}/members/${st.uid}`, { nick })]); rowsCache = null; },
      async board() {
        await ensureWeek();
        const r = sorted(await rows()); st.lastRank = rankOf(r); keep();
        return { week: st.wk, endsAt: weekStart() + WEEK, tier: st.tier || 0, rows: r, up: UP, down: DOWN };
      },
      async add(pts) {
        if (!st.joined || !(pts > 0)) return null;
        await ensureWeek();
        const before = (await rows()).map(x => ({ ...x })), b = rankOf(before);
        await commit([w(`weeks/${st.wk}/members/${st.uid}`, { at: now() }, { inc: { pts } })]);
        st.pts = (st.pts || 0) + pts; keep();
        rowsCache = rowsCache.map(x => x.me ? { ...x, pts: st.pts } : x);   // önbellekteki tabloda kendi puanım (öbürleri dakikada bir tazelenir)
        const after = sorted(rowsCache), a = rankOf(after); st.lastRank = a; keep();
        return { before: b, after: a, pts: st.pts, add: pts, tier: st.tier || 0, rows: after };
      },
      async report(uid, why = '') { st.reported = { ...(st.reported || {}), [uid]: 1 }; keep(); await commit([w(`reports/${st.uid}_${uid}`, { by: st.uid, uid, why, wk: st.wk || '', at: now() })]).catch(() => {}); },
    };

    // --- canlı kapışma: kuyruk / oda → maç belgesi; ilerleme saniyede bir okunur (REST'te canlı dinleme yok) ---
    let M = null;
    const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', code5 = () => Array.from({ length: 5 }, () => A[(Math.random() * A.length) | 0]).join('');
    const pickLevel = (lv, maxL) => { const ok = lv.filter(l => l <= maxL); return ok.length ? ok[(Math.random() * ok.length) | 0] : Math.min(...lv, maxL); };
    const meCard = info => ({ nick: st.nick, tier: st.tier || 0, lv: info.levels || [1], maxL: Math.max(...(info.levels || [1])) });
    async function makeMatch(tx, other, otherUid, info, extra) {
      const id = `${otherUid}_${st.uid}_${Date.now().toString(36)}`, level = pickLevel(other.lv || [1], Math.max(...(info.levels || [1]))), t0 = now() + 4500;
      return { id, level, t0, writes: [w(`matches/${id}`, { a: otherUid, b: st.uid, an: other.nick, bn: st.nick, at: other.tier || 0, bt: st.tier || 0, level, t0, fr: !!extra?.friend }), ...(extra?.writes || [])] };
    }
    function follow(m, side) {
      // maç bulundu: rakibin ilerlemesini saniyede bir oku; 25 sn haber gelmezse rakip ayrılmış sayılır
      M = { ...m, side, cbs: [], tl: [], left: false, last: Date.now() };
      const opp = side === 'a' ? 'pb' : 'pa', me = M;
      const poll = async () => {
        if (me.left) return;
        try { const d = await get(`matches/${me.id}`); const p = d?.[opp];
          if (p) { me.last = Date.now(); me.cbs.forEach(cb => cb({ lit: p.lit || 0, moves: p.moves || 0, done: !!p.done, ms: p.ms || 0, left: !!p.left })); }
          else if (Date.now() - me.last > 25e3 && Date.now() > me.t0Local + 20e3) me.cbs.forEach(cb => cb({ lit: 0, moves: 0, done: false, left: true })); } catch {}
        if (!me.left) me.timer = setTimeout(poll, 1000);
      };
      M.t0Local = m.t0 - skew; M.timer = setTimeout(poll, Math.max(500, M.t0Local - Date.now()));
      return { id: m.id, level: m.level, t0: M.t0Local, opp: m.opp };
    }
    // rakip yoksa: aynı bölümlerden birinin kayıtlı oyunu (gerçek oyuncu); ilerlemesi zaman çizelgesinden
    async function ghost(info) {
      const lv = (info.levels || [1]).slice(-10);
      const gs = await query('', Q('ghosts', ['level', 'IN', lv]), 20).catch(() => []);
      const g = gs.filter(x => x.by !== st.uid && x.tl?.length)[(Math.random() * gs.length) | 0] || gs.find(x => x.tl?.length);
      if (!g) return null;
      const t0 = Date.now() + 3000, me = M = { id: 'ghost_' + g.id, cbs: [], tl: [], left: false, ghost: true };
      const tl = g.tl; let k = 0;
      const tick = () => { if (me.left) return; const e = Date.now() - t0; while (k < tl.length - 1 && tl[k + 1][0] <= e) k++;
        const [ms, lit, mv] = tl[k], done = k === tl.length - 1 && e >= ms && lit >= 1;
        me.cbs.forEach(cb => cb({ lit, moves: mv || 0, done, ms: e })); if (!done) me.timer = setTimeout(tick, 700); };
      me.timer = setTimeout(tick, 3000);
      return { id: me.id, level: g.level, t0, opp: { nick: g.nick || '?', tier: g.tier || 0, ghost: true } };
    }
    fb.duel = {
      async find(info = {}) {
        fb.duel.leave(); await auth(); if (!st.joined) return null;
        const token = M = { id: 'wait', cbs: [], left: false };
        // 1) bekleyen biri var mı (son 20 sn)
        const cands = (await query('', Q('q', ['at', 'GREATER_THAN', now() - 20e3]), 10).catch(() => [])).filter(x => x.id !== st.uid && x.state === 'wait');
        for (const c of cands) {
          let made = null;
          const ok = await txn(async tx => { const q = await get(`q/${c.id}`, tx); if (!q || q.state !== 'wait') return null;
            made = await makeMatch(tx, q, c.id, info); return [...made.writes, w(`q/${c.id}`, { state: 'taken', mid: made.id })]; }).catch(() => null);
          if (ok && made && !token.left) return follow({ ...made, opp: { nick: c.nick, tier: c.tier || 0 } }, 'b');
        }
        // 2) kuyruğa gir, 20 sn bekle
        await commit([w(`q/${st.uid}`, { ...meCard(info), at: now(), state: 'wait', mid: '' })]);
        const until = Date.now() + 20e3;
        while (Date.now() < until && !token.left) {
          await new Promise(r => setTimeout(r, 1200));
          const q = await get(`q/${st.uid}`).catch(() => null);
          if (q?.state === 'taken' && q.mid) { const m = await get(`matches/${q.mid}`); del(`q/${st.uid}`);
            if (m) return follow({ id: q.mid, level: m.level, t0: m.t0, opp: { nick: m.bn, tier: m.bt || 0 } }, 'a'); }
        }
        await del(`q/${st.uid}`);
        if (token.left) return null;
        return ghost(info);   // 3) kimse yok → kayıtlı oyun (yoksa null: "şu an rakip yok")
      },
      async host(info = {}) {
        fb.duel.leave(); await auth();
        const code = code5(), token = M = { id: 'room', cbs: [], left: false };
        await commit([w(`rooms/${code}`, { ...meCard(info), host: st.uid, at: now(), state: 'wait', mid: '' }, { exists: false })]);
        return { code, wait: async () => {
          const until = Date.now() + 10 * 60e3;   // oda 10 dk açık
          while (Date.now() < until && !token.left) {
            await new Promise(r => setTimeout(r, 1500));
            const r = await get(`rooms/${code}`).catch(() => null);
            if (r?.state === 'taken' && r.mid) { const m = await get(`matches/${r.mid}`); del(`rooms/${code}`);
              if (m) return follow({ id: r.mid, level: m.level, t0: m.t0, opp: { nick: m.bn, tier: m.bt || 0, friend: true } }, 'a'); }
          }
          del(`rooms/${code}`); return null;
        } };
      },
      async join(code, info = {}) {
        code = String(code || '').toUpperCase(); if (!/^[A-Z2-9]{5}$/.test(code)) return { error: 'code' };
        fb.duel.leave(); await auth();
        let made = null, room = null;
        const ok = await txn(async tx => { room = await get(`rooms/${code}`, tx); if (!room || room.state !== 'wait' || room.host === st.uid || now() - room.at > 10 * 60e3) return null;
          made = await makeMatch(tx, room, room.host, info, { friend: true }); return [...made.writes, w(`rooms/${code}`, { state: 'taken', mid: made.id })]; }).catch(() => null);
        if (!ok || !made) return { error: 'code' };
        return follow({ ...made, opp: { nick: room.nick, tier: room.tier || 0, friend: true } }, 'b');
      },
      send(p) {
        if (!M || M.left || !M.side) return;
        M.tl.push([Math.round(p.ms || 0), +(+p.lit || 0).toFixed(3), p.moves || 0]);
        commit([w(`matches/${M.id}`, { [M.side === 'a' ? 'pa' : 'pb']: { lit: +(+p.lit).toFixed(3), moves: p.moves || 0, done: !!p.done, ms: Math.round(p.ms || 0), left: !!p.left } })]).catch(() => {});
        // bitirdim: oyunum kayıtlı rakip olarak saklanır (en çok 60 örnek)
        if (p.done && M.tl.length > 2) { const tl = M.tl.filter((_, i, a) => a.length <= 60 || i % Math.ceil(a.length / 60) === 0 || i === a.length - 1);
          commit([w(`ghosts/${M.id}_${M.side}`, { by: st.uid, nick: st.nick, tier: st.tier || 0, level: M.level, tl, at: now() })]).catch(() => {}); }
      },
      onOpp(cb) { M?.cbs.push(cb); },
      leave() { if (!M) return; M.left = true; clearTimeout(M.timer); M = null; },
    };
    return fb;
  }
  return window.__ligFake ? fakeApi : FB(fakeApi);
})();
