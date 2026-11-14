/* KUT ARENA — rakip bulma: eşzamansız "hayalet" çevrimiçi + düello kodu + yedek bot.
   Gerçek zamanlı sunucu gerekmez: her oyuncunun her turdaki takım fotoğrafı havuza yazılır;
   rakip, aynı tur ve benzer kupadaki gerçek bir oyuncunun fotoğrafıdır. Havuz boşsa bot kurar.
   Uzak havuz için `KUT_UZAK` bağdaştırıcısı (Firebase Firestore / Supabase) takılır; yoksa yerel havuz + bot. */
(function (g) {
  const D = g.KUT_DATA || require('./data.js');
  const S = g.KUT_SIM || require('./sim.js');
  const { KAHRAMANLAR, KURAL } = D;

  // ── Bot takımı: oyuncunun oynadığı aynı ekonomi kurallarına yakın, tur ve güçle ölçekli ──
  function botTakim(tur, tohum, guc = 0.5) {
    const R = S.rng(tohum * 7919 + tur * 104729);
    const yuva = KURAL.yuva(tur);
    const soyAd = Object.keys(D.SOYLAR);
    const sevilen = [soyAd[Math.floor(R() * soyAd.length)], soyAd[Math.floor(R() * soyAd.length)]];
    const ol = KURAL.kademeOlasilik(tur);
    const sec = () => {
      const r = R(); const k = r < ol[0] ? 1 : r < ol[0] + ol[1] ? 2 : 3;
      const aday = KAHRAMANLAR.filter(h => h.kademe <= k);
      const agir = aday.map(h => (h.kademe === k ? 2 : 1) + (h.soy.some(s => sevilen.includes(s)) ? 3 : 0));
      let top = agir.reduce((a, b) => a + b, 0), x = R() * top;
      for (let i = 0; i < aday.length; i++) { x -= agir[i]; if (x <= 0) return aday[i]; }
      return aday[aday.length - 1];
    };
    const takim = []; const kullan = new Set();
    let deneme = 0;
    while (takim.length < yuva && deneme++ < 60) {
      const h = sec(); if (kullan.has(h.id)) continue; kullan.add(h.id);
      let s = 1; const p2 = Math.max(0, Math.min(0.8, (tur - 2) * 0.09 + (guc - 0.5) * 0.3));
      if (R() < p2) s = 2; if (tur >= 9 && R() < 0.12 + (guc - 0.5) * 0.2) s = 3;
      const b = { h: h.id, s };
      if (tur >= 4 && s === 1 && R() < 0.25) { const f = KAHRAMANLAR[Math.floor(R() * KAHRAMANLAR.length)]; if (f.id !== h.id && f.kademe <= Math.max(1, Math.ceil(tur / 3))) b.f = f.id; }
      takim.push(b);
    }
    return yerlestir(takim);
  }
  // yakın dövüşçüler öne, menzilliler arkaya
  function yerlestir(takim) {
    const on = takim.filter(b => D.kahraman(b.h).menzil === 1), arka = takim.filter(b => D.kahraman(b.h).menzil > 1);
    const sira = [...on, ...arka]; const yer = [];
    const yuvalar = [[1, 0], [0, 0], [2, 0], [1, 1], [0, 1], [2, 1]];
    const onY = yuvalar.slice(0, 3), arY = yuvalar.slice(3);
    for (const b of sira) { const liste = D.kahraman(b.h).menzil === 1 ? (onY.length ? onY : arY) : (arY.length ? arY : onY); const [x, y] = liste.shift(); yer.push({ ...b, x, y }); }
    return yer;
  }

  // ── Düello kodu: takımı kısa bir metne sığdır (arkadaşına at, o senin takımınla dövüşsün) ──
  const idx = (id) => KAHRAMANLAR.findIndex(h => h.id === id);
  function kodla(takim, ad = '') {
    const ham = takim.map(b => [idx(b.h), b.s, b.f ? idx(b.f) : -1, b.x, b.y].join('.')).join('_');
    return 'KUT1-' + btoa(unescape(encodeURIComponent((ad || '').slice(0, 14) + '|' + ham))).replace(/=+$/, '');
  }
  function coz(kod) {
    try {
      const ic = decodeURIComponent(escape(atob(kod.trim().replace(/^KUT1-/, ''))));
      const [ad, ham] = ic.split('|');
      const takim = ham.split('_').map(p => { const [h, s, f, x, y] = p.split('.').map(Number); const b = { h: KAHRAMANLAR[h].id, s: Math.max(1, Math.min(3, s)), x: x % 3, y: y % 2 }; if (f >= 0) b.f = KAHRAMANLAR[f].id; return b; });
      return { ad, takim: takim.slice(0, 6) };
    } catch (e) { return null; }
  }

  // ── Hayalet havuzu ──
  const ANAHTAR = 'kut.havuz.v1';
  const yerel = {
    oku() { try { return JSON.parse(localStorage.getItem(ANAHTAR) || '[]'); } catch (e) { return []; } },
    yaz(l) { try { localStorage.setItem(ANAHTAR, JSON.stringify(l.slice(-300))); } catch (e) {} },
  };
  const Hayalet = {
    // her tur sonunda çağrılır: kendi fotoğrafını havuza bırakır (başkalarının rakibi olur)
    async birak(kayit) { // {tur, kupa, takim, ad, oyuncu}
      const l = yerel.oku(); l.push({ ...kayit, zaman: Date.now() }); yerel.yaz(l);
      if (g.KUT_UZAK) try { await g.KUT_UZAK.yaz(kayit); } catch (e) {}
    },
    // rakip: önce uzak havuz (aynı tur, ±150 kupa, kendin değil), sonra bot
    async bul({ tur, kupa, oyuncu, tohum }) {
      if (g.KUT_UZAK && (typeof navigator === 'undefined' || navigator.onLine !== false)) {
        try { const r = await g.KUT_UZAK.bul({ tur, kupa, oyuncu }); if (r && r.takim && r.takim.length) return { ...r, kaynak: 'cevrimici' }; } catch (e) {}
      }
      const guc = Math.max(0, Math.min(1, 0.35 + kupa / 2000));
      return { ad: botAd(tohum + tur), takim: botTakim(tur, tohum, guc), kupa, kaynak: 'bot' };
    },
  };
  const ADLAR = ['Kara Bulut', 'Ak Doğan', 'Demir Yay', 'Mavi Kıvılcım', 'Yalın Kılıç', 'Gece Rüzgârı', 'Taş Yürek', 'Ay Kaya', 'Sessiz Ok', 'Kor Göz', 'Bulut Avcısı', 'Buz Pençe'];
  const botAd = (n) => ADLAR[Math.abs(n) % ADLAR.length];

  const api = { botTakim, yerlestir, kodla, coz, Hayalet };
  g.KUT_ONLINE = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
